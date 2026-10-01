"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isValidOneTimeDate } from "@/lib/date";

export interface CheckoutInput {
  customerName: string;
  phone: string;
  address: string;
  landmark?: string;
  orderType: "one_time" | "subscription";
  deliveryDate: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
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
        error: "You must be signed in to place an order.",
      };
    }

    // 2. Validate required fields
    const { customerName, phone, address, landmark, orderType, deliveryDate, items } = input;

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

    if (orderType !== "one_time") {
      return { success: false, error: "Unsupported order type." };
    }

    // AC4.3: Validate delivery date between tomorrow and 30 days ahead in Lagos time
    if (!isValidOneTimeDate(deliveryDate)) {
      return {
        success: false,
        error: "Delivery date must be between tomorrow and 30 days from today (Lagos time).",
      };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty." };
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
          error: `Product is no longer available.`,
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

    // 4. AC5.2 & AC5.3: Insert into orders table
    const insertClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : userClient;

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
        delivery_date: deliveryDate,
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

    return {
      success: true,
      orderId: order.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return { success: false, error: message };
  }
}
