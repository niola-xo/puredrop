"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  isValidOneTimeDate,
  calculateFirstSubscriptionDeliveryDate,
} from "@/lib/date";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";

export interface CheckoutInput {
  customerName: string;
  phone: string;
  address: string;
  landmark?: string;
  orderType: "one_time" | "subscription";
  deliveryDate?: string;
  frequency?: "weekly" | "monthly";
  deliveryWeekday?: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  subscriptionId?: string;
  error?: string;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    // 1. Authenticate user
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user || !user.email) {
      return {
        success: false,
        error: "You must be signed in to place an order or start a subscription.",
      };
    }

    // 2. Validate common required fields
    const {
      customerName,
      phone,
      address,
      landmark,
      orderType,
      items,
      frequency,
      deliveryWeekday,
    } = input;

    if (!customerName || customerName.trim().length === 0) {
      return { success: false, error: "Full name is required." };
    }

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return { success: false, error: "Phone number must have at least 10 digits." };
    }

    if (!address || address.trim().length === 0) {
      return { success: false, error: "Delivery address is required." };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty." };
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
      // Calculate first delivery date using strict PRD Section 8 rules
      finalDeliveryDate = calculateFirstSubscriptionDeliveryDate(deliveryWeekday);
    } else {
      return { success: false, error: "Invalid purchase type." };
    }

    // 3. AC5.1: Recalculate prices from the database `products` table (never trust client prices)
    const productIds = items.map((i) => i.product_id);
    const { data: dbProducts, error: prodError } = await userClient
      .from("products")
      .select("id, name, price_ngn, active")
      .in("id", productIds)
      .eq("active", true);

    if (prodError || !dbProducts || dbProducts.length === 0) {
      return { success: false, error: "Could not retrieve products from the catalog." };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let totalNgn = 0;
    const snapshotItems = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.product_id);
      if (!dbProduct) {
        return {
          success: false,
          error: `A product in your cart is no longer available.`,
        };
      }
      const qty = Math.max(1, Math.floor(item.quantity));
      const lineTotal = dbProduct.price_ngn * qty;
      totalNgn += lineTotal;

      snapshotItems.push({
        product_id: dbProduct.id,
        name: dbProduct.name,
        unit_price_ngn: dbProduct.price_ngn,
        quantity: qty,
      });
    }

    // 4. Save to database using service client if available, else user client with RLS
    const insertClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : userClient;

    if (orderType === "subscription") {
      // AC5.3: Subscription creation
      // Step A: Insert into subscriptions
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

      // Step B: Insert the first order linked to this subscription
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

      // Step C: AC6.1 & AC6.3: Send confirmation email and record status
      await handleOrderEmail(insertClient, {
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

      revalidatePath("/subscription");
      return {
        success: true,
        orderId: order.id,
        subscriptionId: sub.id,
      };
    } else {
      // AC5.2: One-time order creation
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
          error: insertError?.message || "Failed to save order to the database.",
        };
      }

      // AC6.1 & AC6.3: Send confirmation email and record status
      await handleOrderEmail(insertClient, {
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

      return {
        success: true,
        orderId: order.id,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return { success: false, error: message };
  }
}

/**
 * Helper to send email via Mailgun and persist status in orders table (AC6.1, AC6.3)
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
) {
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

  // Update orders row with email_status and email_error (AC6.3)
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
}

/**
 * AC6.3: Cancel an existing subscription
 * Updates status to 'cancelled' and sets cancelled_at timestamp.
 * Enforces ownership so users can only cancel their own subscription.
 */
export async function cancelSubscription(subscriptionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in." };
    }

    const client = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : userClient;

    const { error } = await client
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/subscription");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel subscription.";
    return { success: false, error: message };
  }
}
