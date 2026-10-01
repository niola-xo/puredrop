import { formatFriendlyDate, getWeekdayName } from "./date";
import { formatNaira } from "./cart";

export interface SendEmailPayload {
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

export interface MailgunSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * AC6.1 & AC6.2: Send order/subscription confirmation email via Mailgun HTTP API
 * Uses plain fetch with HTTP Basic Auth (no external SDK).
 */
export async function sendOrderConfirmationEmail(
  payload: SendEmailPayload
): Promise<MailgunSendResult> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const apiBase = process.env.MAILGUN_API_BASE || "https://api.mailgun.net";
  const defaultFrom = domain
    ? `PureDrop Orders <postmaster@${domain}>`
    : "PureDrop Orders <orders@puredrop.ng>";
  const from = process.env.MAILGUN_FROM || defaultFrom;

  if (!apiKey || !domain) {
    return {
      success: false,
      error: "Missing MAILGUN_API_KEY or MAILGUN_DOMAIN configuration.",
    };
  }

  const {
    to,
    orderId,
    orderType,
    customerName,
    address,
    landmark,
    items,
    totalNgn,
    deliveryDate,
    frequency,
    deliveryWeekday,
  } = payload;

  const formattedDate = formatFriendlyDate(deliveryDate);
  const formattedTotal = formatNaira(totalNgn);
  const isSubscription = orderType === "subscription";

  const subject = isSubscription
    ? `PureDrop Subscription Confirmation #${orderId.slice(0, 8)}`
    : `PureDrop Order Confirmation #${orderId.slice(0, 8)}`;

  // Build items text list
  const itemsText = items
    .map(
      (item) =>
        `- ${item.name} x ${item.quantity} (${formatNaira(item.unit_price_ngn)} each) = ${formatNaira(
          item.unit_price_ngn * item.quantity
        )}`
    )
    .join("\n");

  // Build items HTML table rows
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
          <strong>${item.name}</strong><br/>
          <span style="color: #64748b; font-size: 12px;">Qty: ${item.quantity} &times; ${formatNaira(
        item.unit_price_ngn
      )}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0061a5; font-weight: bold; text-align: right;">
          ${formatNaira(item.unit_price_ngn * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  // Delivery details section
  let scheduleText = `Delivery Date: ${formattedDate}`;
  let scheduleHtml = `<p style="margin: 4px 0; color: #1e293b;"><strong>Scheduled Delivery:</strong> ${formattedDate}</p>`;

  if (isSubscription) {
    const weekdayName =
      deliveryWeekday !== undefined ? getWeekdayName(deliveryWeekday) : "Scheduled weekday";
    const freqCap = frequency ? frequency.charAt(0).toUpperCase() + frequency.slice(1) : "Weekly";
    scheduleText = `Subscription: ${freqCap} (Every ${weekdayName})\nFirst Delivery Date: ${formattedDate}`;
    scheduleHtml = `
      <p style="margin: 4px 0; color: #1e293b;"><strong>Frequency:</strong> ${freqCap} (Every ${weekdayName})</p>
      <p style="margin: 4px 0; color: #1e293b;"><strong>First Delivery Date:</strong> ${formattedDate}</p>
    `;
  }

  const landmarkText = landmark ? `\nLandmark: ${landmark}` : "";
  const landmarkHtml = landmark
    ? `<p style="margin: 4px 0; color: #1e293b;"><strong>Landmark:</strong> ${landmark}</p>`
    : "";

  // Plain Text Version (AC6.2 required fields)
  const text = `
PureDrop Order Confirmation
==================================================

Hello ${customerName},

Thank you for your order with PureDrop! Factory dispatch in Akoka has received your details.

Order Reference: ${orderId}
Order Type: ${isSubscription ? "Recurring Subscription" : "One-Time Order"}

ITEMS:
${itemsText}

TOTAL: ${formattedTotal}

DELIVERY ADDRESS:
${address}${landmarkText}

DELIVERY SCHEDULE:
${scheduleText}

Payment: demo mode, no money was charged

==================================================
PureDrop Water Factory - Fresh Pure Water in Akoka & Yaba, Lagos.
`.trim();

  // HTML Version (AC6.2 required fields with Frutiger Aero aesthetic)
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f7ff; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 97, 165, 0.08); border: 1px solid #dbeafe;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0061a5 0%, #0093e9 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">PureDrop</h1>
      <p style="margin: 0; font-size: 13px; color: #e0f2fe; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
        ${isSubscription ? "Subscription Confirmation" : "Order Confirmation"}
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px;">
      <p style="font-size: 16px; margin: 0 0 16px 0; color: #001d35;">
        Hello <strong>${customerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 24px 0;">
        ${
          isSubscription
            ? "Your recurring pure water subscription is confirmed! Our factory drivers will deliver your water batch directly to your address."
            : "Your one-time water batch order is confirmed! Our factory drivers will deliver on your chosen date."
        }
      </p>

      <!-- Reference Box -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block;">Order Reference</span>
        <span style="font-size: 14px; font-family: monospace; font-weight: 700; color: #0061a5;">${orderId}</span>
      </div>

      <!-- Items Table -->
      <h3 style="font-size: 14px; font-weight: 700; color: #001d35; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
        ${isSubscription ? "Subscribed Items" : "Ordered Items"}
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 14px 0 0 0; font-size: 16px; font-weight: 800; color: #001d35;">Total</td>
            <td style="padding: 14px 0 0 0; font-size: 20px; font-weight: 800; color: #0061a5; text-align: right;">${formattedTotal}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Delivery Details Card -->
      <div style="background: #f0f7ff; border-radius: 14px; padding: 18px; margin-bottom: 24px; border: 1px solid #bfdbfe;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #0061a5; text-transform: uppercase; letter-spacing: 0.5px;">
          Delivery Information
        </h4>
        <p style="margin: 4px 0; color: #1e293b;"><strong>Address:</strong> ${address}</p>
        ${landmarkHtml}
        ${scheduleHtml}
      </div>

      <!-- Payment Disclosure (AC6.2 required) -->
      <div style="background: #ecfdf5; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid #a7f3d0; text-align: center;">
        <span style="font-size: 13px; font-weight: 700; color: #047857;">
          Payment: demo mode, no money was charged
        </span>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        PureDrop Water Factory &bull; Akoka & Yaba, Lagos, Nigeria
      </p>
    </div>
  </div>
</body>
</html>
`.trim();

  try {
    const url = `${apiBase.replace(/\/$/, "")}/v3/${domain}/messages`;
    const authString = Buffer.from(`api:${apiKey}`).toString("base64");

    const body = new URLSearchParams();
    body.append("from", from);
    body.append("to", to);
    body.append("subject", subject);
    body.append("text", text);
    body.append("html", html);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        error: `Mailgun HTTP ${response.status}: ${errorBody}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error contacting Mailgun.";
    return {
      success: false,
      error: msg,
    };
  }
}
