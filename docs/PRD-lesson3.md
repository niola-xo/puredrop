# PureDrop Mobile: Lesson 3 PRD (v1)

## 1. Goal

Build a mobile app for the existing PureDrop shop. The app and the website share one backend and one account:

- A user signs in with the same Google account on both the website and the mobile app.
- When a user adds an item to the cart on the website, it must appear **instantly** in the cart on the mobile app, with no manual refresh. Changes made on the phone must also appear on the website.

Deadline: Monday 5 October 2026, 11:59 PM WAT. The final submission is a **link**, so the app must also run as a public web link that works on any phone or laptop. An Android `.apk` is built as well.

## 2. Two repositories, one backend

- **WEB repo:** the existing `puredrop` app (Next.js, Supabase, Vercel). Only the cart changes in section 7 (W1) are allowed here.
- **MOBILE repo:** a new repo called `puredrop-mobile` (Expo, React Native, TypeScript, Expo Router).
- Both use the **same Supabase project**. This is our "same API endpoints": the same Auth (Google), the same Postgres tables and auto-generated REST API, and the same Realtime channel.

Every phase in section 8 is tagged [WEB] or [MOBILE]. Only do the phases that belong to the repo you are working in. If asked to do a phase for the other repo, say so and stop.

## 3. Rules for the agent (read first)

1. Work one phase at a time, in the order of section 8. Finish a phase, then STOP and wait for me to say "continue".
2. At the end of each phase, run the app and the checks yourself (build, lint, and the phase's test steps). Report every acceptance criterion with one status:
   - **PASS**: you verified it and can show evidence (what you ran, what you saw).
   - **FAIL**: it does not work or you could not verify it.
   - **MANUAL**: it needs my physical phone or a dashboard step. List the exact steps I must do. Never mark a MANUAL item as PASS.
3. Do not skip, reduce or quietly change a requirement. If something is unclear or impossible, say so and ask.
4. Never invent keys or secrets. When you need a value, list the exact variable name and stop.
5. Never put `SUPABASE_SERVICE_ROLE_KEY` or `MAILGUN_API_KEY` in the mobile app. The mobile app only uses the public Supabase URL and anon key.
6. Do not break existing web features (login, products, checkout, subscriptions, the Mailgun email, admin). After any web change, run a regression check and report it.
7. No extra features and no new libraries unless truly needed. Keep it simple and mobile first.

## 4. Scope

**In scope:** Google login on mobile with the same Supabase account, product list, cart (add, change quantity, remove), live two-way cart sync with the website, public web link of the mobile app, Android `.apk`, README.

**Out of scope (list as "next steps" in the README):** checkout and subscriptions on mobile, payments, admin, push notifications, iOS build, offline mode.

## 5. Data model: `cart_items` (new, in the shared Supabase project)

```
cart_items
  id          uuid primary key default gen_random_uuid()
  user_id     uuid not null references auth.users(id) on delete cascade
  product_id  uuid not null references products(id)
  quantity    int not null check (quantity between 1 and 99)
  updated_at  timestamptz not null default now()
  unique (user_id, product_id)
```

- Row level security on. A signed-in user can select, insert, update and delete only rows where `auth.uid() = user_id`.
- Add the table to the `supabase_realtime` publication, and set `replica identity full` so delete events carry the row data.
- Recommended: a SQL function `add_to_cart(p_product_id uuid, p_qty int)` that inserts, or on conflict increases the quantity, so two quick adds never overwrite each other.
- Put the SQL in a numbered file in `supabase/migrations/` in the WEB repo and tell me to run it in the Supabase SQL editor.

## 6. Pages and screens

**Mobile app (tabs):** Products, Cart (with item-count badge), Account.
**Website:** unchanged pages. Only the cart storage and live updates change.

## 7. Features and acceptance criteria

### W1 Website cart moves to the database [WEB]
- AC-W1.1 When signed in, adding, changing quantity and removing on the website write to `cart_items`. A page refresh keeps the cart.
- AC-W1.2 When signed out, the cart still works using `localStorage`. At login, local items merge into the database cart (same product quantities add up) and the local cart is cleared.
- AC-W1.3 The website cart updates live (Realtime) when `cart_items` changes from another device, with no refresh.
- AC-W1.4 After a successful order (one-time or subscription), that user's `cart_items` rows are deleted, so the cart is empty on both web and mobile.
- AC-W1.5 Regression: login, products, checkout, subscriptions, the Mailgun email and `/admin` all still work as before.
- AC-W1.6 Isolation: user A cannot read or change user B's cart rows (test with two accounts).

### M1 Mobile project and deployment [MOBILE]
- AC-M1.1 An Expo TypeScript app with Expo Router and three tabs: Products, Cart, Account.
- AC-M1.2 The web export of the app is deployed to Vercel at a public URL. It opens in an incognito window with no Vercel login, works on a phone browser and a laptop, and a page refresh on any route does not 404.
- AC-M1.3 The app opens in Expo Go on my phone (MANUAL).
- AC-M1.4 The only env vars are `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. No secrets anywhere. A `.env.example` exists.

### M2 Login [MOBILE]
- AC-M2.1 "Continue with Google" signs in through Supabase Auth using the same Google provider as the website. It works on the Vercel web link, in Expo Go and in the `.apk`.
- AC-M2.2 The session persists after fully closing and reopening the app.
- AC-M2.3 The Account tab shows the user's email and a working Logout.
- AC-M2.4 Signing in with the same Google account as on the website gives the **same user** (one user in Supabase Auth, not two).
- AC-M2.5 Signed-out users can browse products. Pressing "Add to cart" or opening the Cart tab asks them to sign in.
- AC-M2.6 List the exact redirect URLs I must add under Supabase Auth URL Configuration (the Vercel URL, the app scheme `puredrop://`, and the Expo Go URL pattern) (MANUAL).

### M3 Products [MOBILE]
- AC-M3.1 Products load from the Supabase `products` table, with name, description and price shown as `₦2,400`.
- AC-M3.2 "Add to cart" writes to `cart_items` for the signed-in user and shows clear feedback (cart badge goes up).

### M4 Cart [MOBILE]
- AC-M4.1 The Cart tab lists each item with name, unit price, quantity, line total, plus and minus buttons (minimum 1), a remove button, and the cart total.
- AC-M4.2 An empty cart shows a friendly message and a button to products.
- AC-M4.3 The cart subscribes to Realtime changes on `cart_items` for the signed-in user and also reloads when the app returns to the foreground.
- AC-M4.4 A note on the cart reads "Checkout is on the website" with a link to the website's `/checkout`.

### M5 Cross-device sync (the main requirement)
- AC-M5.1 Add an item on the website: it appears in the mobile cart within 3 seconds, with no manual refresh (MANUAL on my physical phone; you verify the same behaviour with two separate browser sessions and report evidence).
- AC-M5.2 Change the quantity or remove an item on the website: the mobile cart updates live.
- AC-M5.3 Add, change or remove on mobile: the website cart updates live.
- AC-M5.4 A different Google account sees its own, separate cart.
- AC-M5.5 Placing an order on the website empties the cart on both.

### M6 Delivery [MOBILE]
- AC-M6.1 `app.json` has the name "PureDrop", slug `puredrop`, scheme `puredrop`, and Android package `com.puredrop.app`.
- AC-M6.2 `eas.json` has a `preview` profile that builds an Android `.apk`. You prepare it and I run the build (MANUAL).
- AC-M6.3 The README covers: what the app is, the live web link, the apk download link, how the website and the app share one Supabase project (Auth, tables, Realtime), how to run it locally, env vars, and the "next steps" list.
- AC-M6.4 No secrets in the repo or its history.

## 8. Build order (stop and test after every phase)

**Phase 0 [MOBILE]: Repo and live link first**
I create an empty GitHub repo `puredrop-mobile` and give you the URL. Create the Expo app with tabs, add web support, push to GitHub. Deploy the web export to Vercel (suggested: build command `npx expo export --platform web`, output folder `dist`, plus a `vercel.json` rewrite so every route serves the app, unless you find a better supported setup). Env vars are baked in at build time, so set them in Vercel before building and redeploy after any change.
Stop and test: AC-M1.1, AC-M1.2, AC-M1.4, and the MANUAL Expo Go check (AC-M1.3).

**Phase 1 [WEB]: Cart in the database**
Migration for `cart_items`, the add_to_cart function, RLS and Realtime. Move the website cart to the database when signed in, keep `localStorage` when signed out, merge at login, subscribe to live changes, clear the cart after an order.
Stop and test: AC-W1.1 to AC-W1.6. Deploy to production and test there.

**Phase 2 [MOBILE]: Google login**
Supabase client with secure session storage (AsyncStorage on native), Google sign-in via the browser flow, Account tab, auth gate for the cart.
Stop and test: AC-M2.1 to AC-M2.6, on the Vercel link first, then in Expo Go.

**Phase 3 [MOBILE]: Products and add to cart**
Stop and test: AC-M3.1, AC-M3.2.

**Phase 4 [MOBILE]: Cart with live updates**
Stop and test: AC-M4.1 to AC-M4.4.

**Phase 5 [BOTH]: Sync verification**
Fix any sync bugs. Run every criterion in M5 and W1.
Stop and test: AC-M5.1 to AC-M5.5. I will record a screen video with the website and phone side by side.

**Phase 6 [MOBILE]: APK, README, final check**
Prepare `app.json` and `eas.json`, write the README, and tell me the exact `eas` commands to run. After I install the `.apk` on my phone, re-test login and sync inside it.
Stop and test: AC-M6.1 to AC-M6.4, then a full written report of every criterion as PASS, FAIL or MANUAL.

## 9. Environment variables

**Mobile app (public values only):**
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_WEB_URL=     # the website URL, used for the "Checkout is on the website" link
```
**Website:** unchanged.

Set the mobile variables in Vercel (for the web link) and in the Expo build profile (for the `.apk`).

## 10. Definition of done

- Every criterion is PASS, or MANUAL with exact steps and my confirmation.
- Adding an item on the website shows up on my physical phone without a refresh, and the reverse.
- A public link opens the app on any device, and an `.apk` installs on my Android phone.
- No secrets in either repository.
