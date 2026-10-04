"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { processCheckout } from "@/lib/checkout";

export interface CheckoutInput {
  customerName: string;
  phone: string;
  address: string;
  landmark?: string;
  orderType: "one_time" | "subscription";
  deliveryDate?: string;
  frequency?: "weekly" | "monthly";
  deliveryWeekday?: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  items?: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  subscriptionId?: string;
  emailStatus?: "sent" | "failed";
  error?: string;
}

/**
 * Server action called by the website checkout form.
 * Delegates to the shared processCheckout implementation.
 */
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  try {
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

    return await processCheckout({
      user: {
        id: user.id,
        email: user.email,
      },
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      landmark: input.landmark,
      orderType: input.orderType,
      deliveryDate: input.deliveryDate,
      frequency: input.frequency,
      deliveryWeekday: input.deliveryWeekday,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return { success: false, error: message };
  }
}

/**
 * Cancel an existing subscription
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
