# Lesson 3 Addendum: Checkout inside the mobile app (stretch, Phase 7)

Save this as `docs/PRD-lesson3-checkout.md` in BOTH repos. It adds to `docs/PRD-lesson3.md` and does not replace it.

## Rule: core first

Only start this addendum when Phases 0 to 6 of `PRD-lesson3.md` are all PASS (or MANUAL and confirmed by me). The core requirements (shared login, live cart sync, tested on my phone, shareable link) are graded first. Do not delay them for checkout.

This addendum replaces acceptance criterion AC-M4.4 ("Checkout is on the website"). Once it is done, the Cart tab has a working Checkout button.

## Why we need a shared API

The website's checkout is a Next.js server action, which a mobile app cannot call. So the website gets a real HTTP endpoint that BOTH clients can use. This also matches the course wording "use the same API endpoints".

## W2 [WEB]: Shared checkout API

- Add `POST /api/checkout`.
- Authentication: header `Authorization: Bearer <Supabase access token>`. Verify the token on the server and get the user from it.
- Body: `customer_name`, `phone`, `address`, `landmark` (optional), `purchase_type` (`one_time` or `subscription`), and either `delivery_date` (one-time) or `frequency` plus `delivery_weekday` (subscription).
- The server reads the cart from the `cart_items` table for that user. It must NOT accept items or prices from the request.
- Move the logic of the existing `placeOrder` server action into one shared function. The website action and the new API route both call it, so validation, date rules, price calculation, saving and the Mailgun email stay identical.
- Return JSON: `{ order_id, email_status }`.
- Add CORS headers and an OPTIONS handler so the mobile web build (a different origin on Vercel) can call it. The server must only allow the mobile app's URL, not every origin.

Acceptance criteria:
- AC-W2.1 A request with a missing or invalid token returns 401.
- AC-W2.2 Items and prices come only from `cart_items` and `products`. Values sent by the client are ignored.
- AC-W2.3 The same validation and date rules as the website apply (phone at least 10 digits, one-time dates from tomorrow to 30 days, weekdays Monday to Sunday).
- AC-W2.4 It creates the same rows as the website (an order, or a subscription plus a first order), sends the Mailgun email, records `email_status`, and clears the user's `cart_items`.
- AC-W2.5 Regression: the website checkout, subscriptions, email and `/admin` still work.
- AC-W2.6 CORS works from the mobile Vercel URL, and a call from another origin is refused.

## M7 [MOBILE]: Checkout screens

- A "Checkout" button on the Cart tab opens the checkout screen. Signed-out users are sent to sign in first.
- Fields: full name (required), phone (required, at least 10 digits), delivery address (required), landmark (optional).
- Purchase type: "One-time order" (default) or "Subscribe".
  - One-time: choose the delivery date from a simple list of the next 30 days starting tomorrow (Lagos time). Do not add a date picker library.
  - Subscribe: choose Weekly or Monthly and a weekday from Monday to Sunday. Show the computed first delivery date, using the same rule as the website.
- Order summary with items and total, read from the cart.
- Payment section labelled "Demo mode: no real payment is taken". No card fields.
- Main button: "Place order" or "Start subscription". It calls `POST /api/checkout` on the website with the session token.
- Success screen: order reference, a short summary, and the message "A confirmation email was sent to <email>" only when `email_status` is `sent`, otherwise "Your order is saved, but we could not send the email."
- After success the cart is empty on the phone and on the website.
- The "My subscription" page stays on the website for now. Show a link to it after a subscription is created.
- Add `EXPO_PUBLIC_API_URL` (the website URL) as a public variable.

Acceptance criteria:
- AC-M7.1 The Cart tab has a Checkout button that opens the checkout screen.
- AC-M7.2 Field validation matches the website, with error messages next to the fields.
- AC-M7.3 One-time order from the phone creates the same database row and email as one placed on the website.
- AC-M7.4 Subscribe from the phone creates a subscription plus a first order, and shows the first delivery date.
- AC-M7.5 After checkout the cart is empty on mobile and on the website without a manual refresh.
- AC-M7.6 It works on the Vercel link, in Expo Go and in the `.apk` (the last two are MANUAL).

## Phase 7 (stop and test)

1. [WEB] Build W2. Stop and test AC-W2.1 to AC-W2.6 on the production site. I will check with a real order.
2. [MOBILE] Build M7. Stop and test AC-M7.1 to AC-M7.6.

Cut line: if time is short, build one-time orders only (skip Subscribe) and tell me clearly what was left out. Never mark a skipped criterion as PASS.
