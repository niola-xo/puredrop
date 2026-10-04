import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { processCheckout } from "@/lib/checkout";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

/**
 * Validates the Origin header against allowed mobile web URLs.
 * Returns CORS headers if allowed, or null if refused (AC-W2.6).
 */
function getCorsHeaders(origin: string | null): Record<string, string> | null {
  if (!origin) return null;

  const allowedOrigins: string[] = [];

  if (process.env.MOBILE_APP_URL) {
    allowedOrigins.push(normalizeUrl(process.env.MOBILE_APP_URL));
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    allowedOrigins.push(normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL));
  }

  const normOrigin = normalizeUrl(origin);

  const isAllowed =
    allowedOrigins.includes(normOrigin) ||
    normOrigin.startsWith("http://localhost:") ||
    normOrigin.startsWith("http://127.0.0.1:");

  if (!isAllowed) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle CORS preflight requests (AC-W2.6)
 */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return new NextResponse(null, { status: 204 });
  }

  const corsHeaders = getCorsHeaders(origin);
  if (!corsHeaders) {
    return new NextResponse("CORS origin not allowed", { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

interface CheckoutRequestBody {
  customer_name?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  landmark?: string | null;
  purchase_type?: "one_time" | "subscription";
  orderType?: "one_time" | "subscription";
  delivery_date?: string;
  deliveryDate?: string;
  frequency?: "weekly" | "monthly";
  delivery_weekday?: number;
  deliveryWeekday?: number;
}

/**
 * POST /api/checkout (W2 Shared checkout API)
 *
 * AC-W2.1: Missing or invalid token returns 401.
 * AC-W2.2: Items and prices come only from cart_items and products.
 * AC-W2.3: Same validation and date rules apply.
 * AC-W2.4: Creates order/subscription, sends Mailgun email, records email_status, and clears cart_items.
 * AC-W2.6: Refuses calls from unapproved CORS origins.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let corsHeaders: Record<string, string> = {};

  if (origin) {
    const headers = getCorsHeaders(origin);
    if (!headers) {
      return NextResponse.json(
        { error: "CORS origin not allowed" },
        { status: 403 }
      );
    }
    corsHeaders = headers;
  }

  // 1. Verify Authorization: Bearer <Supabase access token> (AC-W2.1)
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401, headers: corsHeaders }
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return NextResponse.json(
      { error: "Authorization token cannot be empty" },
      { status: 401, headers: corsHeaders }
    );
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user || !user.email) {
    return NextResponse.json(
      { error: "Invalid or expired authorization token" },
      { status: 401, headers: corsHeaders }
    );
  }

  // 2. Parse request body
  let body: CheckoutRequestBody;
  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const customerName = String(body.customer_name ?? body.customerName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();
  const landmark = body.landmark ? String(body.landmark).trim() : null;
  const purchaseType = (body.purchase_type ?? body.orderType ?? "one_time") as "one_time" | "subscription";
  const deliveryDate = body.delivery_date ?? body.deliveryDate;
  const frequency = body.frequency;
  const deliveryWeekday = body.delivery_weekday ?? body.deliveryWeekday;

  // 3. Process checkout (AC-W2.2: Items/prices come only from cart_items and products)
  const result = await processCheckout({
    user: {
      id: user.id,
      email: user.email,
    },
    customerName,
    phone,
    address,
    landmark,
    orderType: purchaseType,
    deliveryDate,
    frequency,
    deliveryWeekday,
  });

  if (!result.success || !result.orderId) {
    return NextResponse.json(
      { error: result.error || "Failed to process checkout" },
      { status: 400, headers: corsHeaders }
    );
  }

  // AC-W2.4: Return JSON: { order_id, email_status }
  return NextResponse.json(
    {
      order_id: result.orderId,
      email_status: result.emailStatus ?? "pending",
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}
