import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  isValidOneTimeDate,
  calculateFirstSubscriptionDeliveryDate,
} from "@/lib/date";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";

export interface ProcessCheckoutInput {
  user: {
    id: string;
    email: string;
  };
  customerName: string;
  phone: string;
  address: string;
  landmark?: string | null;
  orderType: "one_time" | "subscription";
  deliveryDate?: string;
  frequency?: "weekly" | "monthly";
  deliveryWeekday?: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
}

export interface ProcessCheckoutResult {
  success: boolean;
  orderId?: string;
  subscriptionId?: string;
  emailStatus?: "sent" | "failed";
  error?: string;
}

/**
 * Shared checkout processor for both website Server Actions and POST /api/checkout.
 *
 * AC-W2.2: Items and prices come only from `cart_items` and `products`.
 * Client-submitted items/prices are not accepted.
 * AC-W2.3: Enforces same validation rules (phone at least 10 digits, Lagos date limits).
 * AC-W2.4: Creates order/subscription, sends Mailgun email, records email_status, and clears cart_items.
 */
export async function processCheckout(
  input: ProcessCheckoutInput
): Promise<ProcessCheckoutResult> {
  try {
    const {
      user,
      customerName,
      phone,
      address,
      landmark,
      orderType,
      frequency,
      deliveryWeekday,
    } = input;

    if (!user || !user.id || !user.email) {
      return {
        success: false,
        error: "You must be signed in to place an order or start a subscription.",
      };
    }

    // 1. Validation (AC-W2.3)
    if (!customerName || customerName.trim().length === 0) {
      return { success: false, error: "Full name is required." };
    }

    const digitsOnly = phone ? phone.replace(/\D/g, "") : "";
    if (digitsOnly.length < 10) {
      return { success: false, error: "Phone number must have at least 10 digits." };
    }

    if (!address || address.trim().length === 0) {
      return { success: false, error: "Delivery address is required." };
    }

    let finalDeliveryDate = input.deliveryDate;

    if (orderType === "one_time") {
      if (!finalDeliveryDate || !isValidOneTimeDate(finalDeliveryDate)) {
        return {
          success: false,
          error: "Delivery date must be between tomorrow and 30 days from today (Lagos time).",
        };
      }
    } else if (orderType === "subscription") {
      if (frequency !== "weekly" && frequency !== "monthly") {
        return { success: false, error: "Please select weekly or monthly frequency." };
      }
      if (
        deliveryWeekday === undefined ||
        deliveryWeekday < 0 ||
        deliveryWeekday > 6
      ) {
        return {
          success: false,
          error: "Please select a weekday from Monday to Sunday.",
        };
      }
      finalDeliveryDate = calculateFirstSubscriptionDeliveryDate(deliveryWeekday);
    } else {
      return { success: false, error: "Invalid purchase type." };
    }

    // 2. Client setup
    const insertClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();

    // 3. AC-W2.2: Load cart strictly from database `cart_items` for this user
    const { data: cartRows, error: cartError } = await insertClient
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", user.id);

    if (cartError || !cartRows || cartRows.length === 0) {
      return { success: false, error: "Your cart is empty. Add water products before checkout." };
    }

    // 4. AC-W2.2: Recalculate prices from `products` table (never trust client)
    const productIds = cartRows.map((r) => r.product_id);
    const { data: dbProducts, error: prodError } = await insertClient
      .from("products")
      .select("id, name, price_ngn, active")
      .in("id", productIds)
      .eq("active", true);

    if (prodError || !dbProducts || dbProducts.length === 0) {
      return { success: false, error: "Could not retrieve products from catalog." };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    let totalNgn = 0;
    const snapshotItems = [];

    for (const item of cartRows) {
      const dbProduct = productMap.get(item.product_id);
      if (!dbProduct) {
        return {
          success: false,
          error: "A product in your cart is no longer available.",
        };
      }
      const qty = Math.max(1, Math.min(99, Math.floor(item.quantity)));
      const lineTotal = dbProduct.price_ngn * qty;
      totalNgn += lineTotal;

      snapshotItems.push({
        product_id: dbProduct.id,
        name: dbProduct.name,
        unit_price_ngn: dbProduct.price_ngn,
        quantity: qty,
      });
    }

    // 5. Save order / subscription (AC-W2.4)
    if (orderType === "subscription") {
      // Step A: Insert subscription
      const { data: sub, error: subError } = await insertClient
        .from("subscriptions")
        .insert({
          user_id: user.id,
          user_email: user.email,
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          landmark: landmark && landmark.trim().length > 0 ? landmark.trim() : null,
          items: snapshotItems,
          total_ngn: totalNgn,
          frequency,
          delivery_weekday: deliveryWeekday,
          next_delivery_date: finalDeliveryDate,
          status: "active",
        })
        .select("id")
        .single();

      if (subError || !sub) {
        return {
          success: false,
          error: subError?.message || "Failed to create subscription record.",
        };
      }

      // Step B: Insert initial subscription order
      const { data: order, error: orderError } = await insertClient
        .from("orders")
        .insert({
          user_id: user.id,
          user_email: user.email,
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          landmark: landmark && landmark.trim().length > 0 ? landmark.trim() : null,
          items: snapshotItems,
          total_ngn: totalNgn,
          order_type: "subscription",
          subscription_id: sub.id,
          delivery_date: finalDeliveryDate,
          payment_status: "demo",
          status: "pending",
          email_status: "pending",
        })
        .select("id")
        .single();

      if (orderError || !order) {
        return {
          success: false,
          error: orderError?.message || "Failed to create initial subscription order.",
        };
      }

      // Step C: Send Mailgun email
      const emailStatus = await handleOrderEmail(insertClient, {
        to: user.email,
        orderId: order.id,
        orderType: "subscription",
        customerName: customerName.trim(),
        address: address.trim(),
        landmark: landmark && landmark.trim().length > 0 ? landmark.trim() : null,
        items: snapshotItems,
        totalNgn,
        deliveryDate: finalDeliveryDate,
        frequency,
        deliveryWeekday,
      });

      // Step D: Delete user's cart_items
      try {
        await insertClient.from("cart_items").delete().eq("user_id", user.id);
      } catch (cartErr) {
        console.error("[Cart] Error clearing cart_items after subscription:", cartErr);
      }

      try {
        revalidatePath("/subscription");
      } catch {
        // Ignored if called outside Next.js render context (e.g. API route)
      }

      return {
        success: true,
        orderId: order.id,
        subscriptionId: sub.id,
        emailStatus,
      };
    } else {
      // One-time order
      const { data: order, error: insertError } = await insertClient
        .from("orders")
        .insert({
          user_id: user.id,
          user_email: user.email,
          customer_name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          landmark: landmark && landmark.trim().length > 0 ? landmark.trim() : null,
          items: snapshotItems,
          total_ngn: totalNgn,
          order_type: "one_time",
          subscription_id: null,
          delivery_date: finalDeliveryDate,
          payment_status: "demo",
          status: "pending",
          email_status: "pending",
        })
        .select("id")
        .single();

      if (insertError || !order) {
        return {
          success: false,
          error: insertError?.message || "Failed to save order to database.",
        };
      }

      // Send Mailgun email
      const emailStatus = await handleOrderEmail(insertClient, {
        to: user.email,
        orderId: order.id,
        orderType: "one_time",
        customerName: customerName.trim(),
        address: address.trim(),
        landmark: landmark && landmark.trim().length > 0 ? landmark.trim() : null,
        items: snapshotItems,
        totalNgn,
        deliveryDate: finalDeliveryDate,
      });

      // Delete user's cart_items
      try {
        await insertClient.from("cart_items").delete().eq("user_id", user.id);
      } catch (cartErr) {
        console.error("[Cart] Error clearing cart_items after order:", cartErr);
      }

      return {
        success: true,
        orderId: order.id,
        emailStatus,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return { success: false, error: message };
  }
}

/**
 * Helper to dispatch confirmation email and persist email_status.
 * Non-blocking on failure.
 */
async function handleOrderEmail(
  client: Awaited<ReturnType<typeof createClient>> | Awaited<ReturnType<typeof createServiceClient>>,
  payload: {
    to: string;
    orderId: string;
    orderType: "one_time" | "subscription";
    customerName: string;
    address: string;
    landmark?: string | null;
    items: Array<{
      product_id: string;
      name: string;
      unit_price_ngn: number;
      quantity: number;
    }>;
    totalNgn: number;
    deliveryDate: string;
    frequency?: "weekly" | "monthly";
    deliveryWeekday?: number;
  }
): Promise<"sent" | "failed"> {
  let emailStatus: "sent" | "failed" = "failed";
  let emailError: string | null = null;

  try {
    const res = await sendOrderConfirmationEmail(payload);
    if (res.success) {
      emailStatus = "sent";
    } else {
      emailStatus = "failed";
      emailError = res.error || "Failed to send confirmation email.";
      console.error("[Mailgun] Email delivery failed:", emailError);
    }
  } catch (err: unknown) {
    emailStatus = "failed";
    emailError = err instanceof Error ? err.message : "Mailgun send exception";
    console.error("[Mailgun] Exception occurred:", emailError);
  }

  // Record status in orders table
  try {
    const { error: updateError } = await client
      .from("orders")
      .update({
        email_status: emailStatus,
        email_error: emailError,
      })
      .eq("id", payload.orderId);

    if (updateError) {
      console.error("[Orders] Failed to update email_status:", updateError.message);
    }
  } catch (dbErr) {
    console.error("[Orders] Exception updating email_status:", dbErr);
  }

  return emailStatus;
}
