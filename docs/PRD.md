# PureDrop: Pure Water Ordering and Subscription App (PRD v1)

## 1. What we are building

A web app for a Lagos pure water factory (sachet water, called "pure water" in Nigeria) to take orders from its regular customers around Akoka and Yaba: students, working people and families.

**The main feature is the subscription.** A customer picks a batch of water, chooses weekly or monthly delivery, and chooses the weekday they will be home. The factory's own drivers deliver. Customers can also place a one-time order when they run out. The factory sees every order and subscription on a dashboard.

This is an HNG15 task due Friday. The brief: a shop website with a checkout page, data saved in Supabase, a confirmation email sent with Mailgun, and Google login set up through Google Cloud Console. Scope is deliberately small. Everything must work and be deployed to one public URL.

## 2. Stack (fixed, do not change)

- Next.js (App Router), TypeScript, Tailwind CSS
- Supabase: Postgres database and Auth (Google provider only). Use `@supabase/ssr`.
- Mailgun, called from the server with plain `fetch` (no SDK)
- Vercel for hosting
- All dates use the `Africa/Lagos` timezone. All prices are in naira, shown like `₦2,400`.

## 3. Rules for the agent (read first)

1. Build in the phases in section 9, in order. Finish one phase completely, then STOP.
2. At the end of every phase, run the app and the checks yourself (build, lint, and that phase's test steps). Then report every acceptance criterion as PASS or FAIL with evidence (what you ran, what you saw). Never write "done" unless every criterion is PASS.
3. Do not skip, reduce or quietly change any requirement. If something is unclear or impossible, say so and ask me.
4. Do not start the next phase until I reply "continue".
5. Never invent API keys or secrets. When a phase needs external values, list the exact environment variable names you need and stop for me to fill them in.
6. Never commit secrets. Keep a `.env.example` with names only.
7. No extra features and no extra libraries unless truly needed. Keep the UI simple, clean and mobile first.

## 4. Scope

**In scope:** products page, cart, checkout, one-time orders, subscriptions (saved as records), demo payment step, orders saved in Supabase, Mailgun confirmation email, Google login, "My subscription" page (view and cancel), read-only factory dashboard.

**Out of scope (list these as "next steps" in the README, do not build):** real payments, saving or charging cards, automatic recurring billing, automatically creating future orders, driver assignment or tracking, SMS or WhatsApp, editing orders from the dashboard, email/password or magic-link login, multiple saved addresses.

## 5. Products (seed data)

| Name | Description | Price (NGN) |
|---|---|---|
| Pure Water, 5-bag batch | 5 bags, about 20 sachets per bag | 2400 |
| Pure Water, 10-bag batch | 10 bags, about 20 sachets per bag | 4600 |
| Pure Water, 20-bag batch | 20 bags, about 20 sachets per bag | 9000 |
| Table Water, 1 pack | One pack of bottled table water | 1500 |
| Dispenser Refill, 1 bottle | One refill bottle for water dispensers | 1600 |

Use simple placeholder images or icons. Prices are stored in the database as whole naira integers.

## 6. Pages

- `/` : short hero explaining the subscription, then the product list
- `/login` : "Continue with Google" button
- `/auth/callback` : completes Google login, then redirects to the page the user came from (default `/`)
- `/cart` : cart review
- `/checkout` : details, purchase type, demo payment, place order
- `/order/[id]` : confirmation page after placing an order or starting a subscription
- `/subscription` : "My subscription"
- `/admin` : factory dashboard

Header on every page: logo, Cart (with item count), My subscription, Factory dashboard (demo), and Login or Logout (show the user's email when logged in).

## 7. Features and acceptance criteria

### F1 Products
- AC1.1 Products load from the Supabase `products` table, not hard-coded.
- AC1.2 Each product shows name, description, price in `₦` format, and an "Add to cart" button.
- AC1.3 Adding an item updates the header cart count immediately.

### F2 Google login
- AC2.1 "Continue with Google" signs the user in through Supabase Auth.
- AC2.2 After login the user returns to the page they started from, on the same domain they started on (never redirected to localhost on production).
- AC2.3 The header shows the user's email and a working Logout.
- AC2.4 `/checkout` and `/subscription` redirect to `/login` when signed out. The cart and products are viewable when signed out.
- AC2.5 No email/password or magic-link login exists anywhere.

### F3 Cart
- AC3.1 Cart lines (product, quantity) are kept in `localStorage` and survive a page refresh.
- AC3.2 The user can change quantity (minimum 1) and remove lines. The total updates immediately.
- AC3.3 An empty cart shows a friendly message and a link back to products, and blocks checkout.

### F4 Checkout
- AC4.1 Fields: full name (required), phone (required, at least 10 digits), delivery address (required), landmark or area (optional).
- AC4.2 A purchase type choice: "One-time order" (default) or "Subscribe".
- AC4.3 One-time order: a delivery date picker. The earliest date is tomorrow and the latest is 30 days from today (Lagos time). Enforced in the form AND on the server.
- AC4.4 Subscribe: a frequency choice (Weekly or Monthly) and a preferred delivery weekday (Monday to Sunday). Show the computed first delivery date before the user submits.
- AC4.5 An order summary with line items and the total.
- AC4.6 A payment section labelled "Demo mode: no real payment is taken". It has NO card number, expiry or CVV fields. Clicking the main button counts as a successful demo payment.
- AC4.7 The main button reads "Place order" for one-time and "Start subscription" for subscribe. Validation errors show next to the fields.

### F5 Saving orders and subscriptions
- AC5.1 Submitting runs on the server. It checks the user is signed in and recalculates all prices from the `products` table (never trust prices sent from the browser).
- AC5.2 One-time: one row is inserted in `orders` with `order_type = 'one_time'`.
- AC5.3 Subscribe: one row in `subscriptions` AND one first row in `orders` with `order_type = 'subscription'`, linked by `subscription_id`.
- AC5.4 After saving, the cart is cleared and the user lands on `/order/[id]`, which shows items, total, address, delivery date, and subscription details when relevant.
- AC5.5 A user can only read their own rows (enforced by row level security).

### F6 Mailgun confirmation email
- AC6.1 After a successful save, the server sends a confirmation email to the customer's Google email through the Mailgun HTTP API.
- AC6.2 The email includes: order reference, items, total, delivery address, delivery date (one-time) or frequency, weekday and first delivery date (subscription), and the line "Payment: demo mode, no money was charged".
- AC6.3 If sending fails, the order is STILL saved. The failure is stored in `orders.email_status` (`sent` or `failed`) and `orders.email_error`, and is logged on the server.
- AC6.4 `/order/[id]` says "A confirmation email was sent to <email>" only when `email_status = 'sent'`. Otherwise it says "Your order is saved, but we could not send the email."

### F7 My subscription
- AC7.1 Lists the signed-in user's subscriptions: items, frequency, weekday, next delivery date, status.
- AC7.2 An active subscription has a Cancel button with a confirm step. Cancelling sets `status = 'cancelled'` and `cancelled_at`, and the page updates.
- AC7.3 If the user has none, show a friendly empty state with a link to products.

### F8 Factory dashboard (read-only)
- AC8.1 `/admin` is allowed when the user is signed in AND either `ADMIN_OPEN_FOR_DEMO` is `true` OR the user's email equals `ADMIN_EMAIL`. Everyone else sees a "Not allowed" page.
- AC8.2 When open for demo, show a banner: "Factory view (demo)".
- AC8.3 Shows two tables, newest first: Subscriptions (customer, phone, address, items, frequency, weekday, next delivery, status) and Orders (customer, phone, address, items, total, type, delivery date, created time).
- AC8.4 It reads data on the server with the service role key. That key must never reach the browser.
- AC8.5 No edit or delete buttons.

## 8. Data model

Use a SQL migration file. Amounts are integer naira. Enable row level security (RLS) on every table.

**products**: `id uuid pk`, `name text`, `description text`, `price_ngn int`, `sort_order int`, `active boolean default true`.
RLS: anyone can read active products. No client writes.

**subscriptions**: `id uuid pk`, `user_id uuid` (auth user), `user_email text`, `customer_name text`, `phone text`, `address text`, `landmark text`, `items jsonb`, `total_ngn int`, `frequency text` (`weekly` or `monthly`), `delivery_weekday int` (0 to 6), `next_delivery_date date`, `status text default 'active'` (`active` or `cancelled`), `created_at timestamptz default now()`, `cancelled_at timestamptz`.
RLS: users can select and update (cancel only) their own rows. Inserts happen on the server.

**orders**: `id uuid pk`, `user_id uuid`, `user_email text`, `customer_name text`, `phone text`, `address text`, `landmark text`, `items jsonb`, `total_ngn int`, `order_type text` (`one_time` or `subscription`), `subscription_id uuid null`, `delivery_date date`, `payment_status text default 'demo'`, `status text default 'pending'`, `email_status text default 'pending'`, `email_error text`, `created_at timestamptz default now()`.
RLS: users can select their own rows. Inserts happen on the server.

`items` is an array of `{ product_id, name, unit_price_ngn, quantity }`, a snapshot taken at order time.

**Delivery date rules**
- One-time: `delivery_date` is between tomorrow and 30 days ahead.
- Subscription: `next_delivery_date` (and the first order's `delivery_date`) is the first occurrence of the chosen weekday that is at least 1 day after today. Monthly means every 4 weeks on that weekday. We only store the next date. Future orders are NOT created automatically.

## 9. Build order (stop and test after every phase)

**Phase 0: Setup and early deploy**
Create the Next.js app, Tailwind, `.env.example`, a simple layout and header. Push to GitHub and deploy to Vercel.
Stop and test: the Vercel production URL opens in an incognito window with no Vercel login (I will check Deployment Protection myself), and `npm run build` passes.

**Phase 1: Database and products**
Write the SQL migration (all tables, RLS, seed products). Build `/` reading products from Supabase.
Stop and test: AC1.1 to AC1.3 on localhost and on the deployed URL. I will run the SQL in Supabase myself.

**Phase 2: Google login**
Supabase Auth with the Google provider, `/login`, `/auth/callback`, header auth state, route protection. Use an environment variable `NEXT_PUBLIC_SITE_URL` for redirects.
Stop and test: AC2.1 to AC2.5 on localhost AND on the deployed URL. You will need my Supabase and Google values, so list the variables first.

**Phase 3: Cart and one-time checkout**
Cart, `/cart`, `/checkout` (one-time only at this stage), server-side save to `orders`, `/order/[id]`.
Stop and test: AC3.1 to AC3.3, AC4.1 to AC4.3, AC4.5 to AC4.7 (one-time parts), AC5.1, AC5.2, AC5.4, AC5.5. Confirm the row exists in Supabase.

**Phase 4: Subscriptions**
Add the Subscribe option, date logic, server save to `subscriptions` and first `orders` row, and the `/subscription` page with Cancel.
Stop and test: AC4.2, AC4.4, AC5.3, AC7.1 to AC7.3. Test a weekly and a monthly case and a cancel.

**Phase 5: Mailgun email**
Server-side Mailgun send for both order types, status tracking, confirmation page message.
Stop and test: AC6.1 to AC6.4, including a forced failure (wrong key) to prove the order still saves. I will supply the Mailgun values.

**Phase 6: Factory dashboard**
`/admin` with the access rule and both tables.
Stop and test: AC8.1 to AC8.5, including with `ADMIN_OPEN_FOR_DEMO` set to `true` and to `false`.

**Phase 7: Polish and final check**
README (what it is, how to run it, env vars, "next steps" list), empty and error states, mobile layout check. Then run the complete flow on the deployed production URL: login, add to cart, one-time order, subscribe, email, My subscription, cancel, admin.
Stop and test: a full written report of every acceptance criterion in this document as PASS or FAIL.

## 10. Environment variables

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
MAILGUN_API_KEY=                  # server only
MAILGUN_DOMAIN=
MAILGUN_API_BASE=https://api.mailgun.net
MAILGUN_FROM=
ADMIN_EMAIL=
ADMIN_OPEN_FOR_DEMO=true
```

Google OAuth keys live in the Supabase dashboard, not in this app.

## 11. Definition of done

- Every acceptance criterion above is PASS on the deployed production URL, with evidence.
- No secrets are in the repository.
- The README lists the out-of-scope items as "next steps", starting with real card payments and automatic recurring billing.
