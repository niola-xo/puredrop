# PureDrop

**PureDrop** is a modern pure water ordering and subscription web application designed for a Lagos pure water factory servicing students, residents, and businesses across Akoka and Yaba (University of Lagos, Yaba College of Technology, Commercial Avenue, and environs).

- **Live URL:** [https://puredrop-swart.vercel.app/](https://puredrop-swart.vercel.app/)
- **Repository:** [https://github.com/niola-xo/puredrop](https://github.com/niola-xo/puredrop)

---

## What We Built

PureDrop allows customers to order sachet water batches, bottled table water, and dispenser refills either as a one-time delivery or as an automated recurring subscription.

### Key Highlights
1. **Recurring Subscriptions:** Customers select their preferred delivery frequency (Weekly or Monthly) and delivery weekday (Monday to Friday). Delivery dates are calculated using strict `Africa/Lagos` timezone rules and a 14:00 cutoff.
2. **One-Time Batch Orders:** Flexible ordering with delivery dates selectable from tomorrow up to 30 days ahead.
3. **Database-Backed Integrity:** Product prices are always re-validated against the database on the server; client prices are never trusted.
4. **Google Authentication:** Streamlined sign-in via Supabase Google OAuth provider (no rate-limited magic links or passwords).
5. **Confirmation Emails via Mailgun:** Automated transactional confirmation emails sent using plain HTTP `fetch` (no SDK), complete with line items, Lagos delivery schedule, and demo payment notices. Delivery failures never block order placement.
6. **Customer Subscription Management:** Self-service `/subscription` portal allowing customers to monitor delivery schedules and cancel subscriptions anytime.
7. **Read-Only Factory Dashboard:** Dedicated dispatch dashboard at `/admin` displaying all factory orders and subscriptions in real time with newest-first ordering and zero edit/delete buttons.

---

## Tech Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Frutiger Aero / Hydro-Glass aesthetic)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, `@supabase/ssr`, Google OAuth)
- **Transactional Email:** Mailgun HTTP Messages API (via native `fetch`)
- **Deployment:** Vercel

---

## Local Development & Setup

### Prerequisites
- Node.js 20+ (tested on Node 22 and 24)
- npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/niola-xo/puredrop.git
   cd puredrop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and supply your keys:
   ```bash
   cp .env.example .env.local
   ```

4. **Run Database Migrations:**
   Execute the migration scripts in your Supabase SQL Editor in numerical order:
   - `supabase/migrations/001_initial_schema.sql` (Tables, RLS, seed products)
   - `supabase/migrations/002_orders_subscriptions_insert_policies.sql` (Insert policies)
   - `supabase/migrations/003_orders_update_policy.sql` (Order status update policy)

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Core Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts local Next.js development server |
| `npm run build` | Builds optimized production bundle |
| `npm run lint` | Runs ESLint verification across the codebase |
| `npm run start` | Starts production server locally after build |

---

## Environment Variables

| Variable | Description | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL of the deployed application | Public (Browser) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API endpoint | Public (Browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anonymous API key | Public (Browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase administrative service role secret | Server Only |
| `MAILGUN_API_KEY` | Mailgun sending API key | Server Only |
| `MAILGUN_DOMAIN` | Mailgun sending domain / sandbox domain | Server Only |
| `MAILGUN_API_BASE` | Mailgun API base URL (`https://api.mailgun.net`) | Server Only |
| `MAILGUN_FROM` | Mailgun sender string (`PureDrop Orders <postmaster@...>`) | Server Only |
| `ADMIN_EMAIL` | Factory administrator email address | Server Only |
| `ADMIN_OPEN_FOR_DEMO` | Toggle (`true`/`false`) allowing demo access to `/admin` | Server Only |

---

## Next Steps (Future Roadmap)

These features were deliberately kept out of scope for the current milestone and are planned for future releases:

1. **Real Payment Gateway Integration:** Connecting live payment providers (Paystack, Flutterwave) for direct card and bank transfer checkouts.
2. **Card Tokenization & Automatic Recurring Billing:** Securely tokenizing customer debit cards to automatically charge subscriptions on each delivery cycle.
3. **Automated Order Dispatch Generation:** Background cron tasks to generate recurring order delivery batches automatically 24 hours before scheduled weekdays.
4. **Driver Dispatch & Fleet Tracking:** Live GPS route optimization, driver assignment, and real-time delivery status updates for Akoka and Yaba routes.
5. **SMS & WhatsApp Alerts:** Real-time driver arrival notifications sent to Nigerian phone numbers via Termii or Twilio WhatsApp API.
6. **Administrative Order Management:** Dashboard capabilities allowing factory dispatchers to re-route deliveries, adjust batch quantities, and update fulfillment statuses.
7. **Customer Address Book:** Support for multiple saved delivery addresses (e.g., hostel room, workplace, faculty department).
