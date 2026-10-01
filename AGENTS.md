<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: PureDrop project rules

## Source of truth
- The product requirements are in `docs/PRD.md`. Read the whole file before any task.
- If this file and the PRD disagree, the PRD decides WHAT to build and this file decides HOW to work.

## How to work
- Work one phase at a time, in the order of PRD section 9. Stop at the end of each phase and wait for me to say "continue".
- Before saying a phase is finished, verify it yourself: run `npm run build` and `npm run lint`, start the dev server, and go through that phase's test steps.
- Report every acceptance criterion for the phase as PASS or FAIL with evidence (what you ran, what you saw). A criterion you did not test counts as FAIL.
- Never skip, shrink or quietly change a requirement. If you are blocked or something is unclear, say so and ask.
- Do not use the words "done", "complete" or "working" without evidence.
- Keep `PROGRESS.md` at the project root: one line per phase with its status and what was verified.

## Stack and commands
- Next.js (App Router), TypeScript, Tailwind CSS, Supabase (`@supabase/ssr`), Mailgun through plain `fetch`, deployed on Vercel.
- Commands: `npm install`, `npm run dev`, `npm run build`, `npm run lint`.

## Conventions
- Secrets stay on the server: `SUPABASE_SERVICE_ROLE_KEY` and `MAILGUN_API_KEY` must never appear in client components or in `NEXT_PUBLIC_` variables.
- Validate all input on the server. Recalculate prices from the `products` table, never trust prices sent from the browser.
- Turn on row level security for every table. Put SQL in numbered files in `supabase/migrations/` and tell me which file to run in the Supabase SQL editor.
- Supabase helpers live in `lib/supabase/` (`client.ts`, `server.ts`).
- Dates use the `Africa/Lagos` timezone. Money is stored as integer naira and shown like `₦2,400`.
- No new dependencies without asking me first. Keep components small.

## Secrets and safety
- Never invent keys or secrets. When you need a value, list the exact variable name and stop.
- Never commit `.env*` files. Keep `.env.example` up to date (names only).
- Do not run destructive commands (deleting files outside the project, dropping tables, force pushes) without asking.
- Do not change Vercel, Supabase, Google or Mailgun dashboard settings yourself. Give me the exact steps and I will do them.

## Known pitfalls from my last project
- Auth redirects: use `NEXT_PUBLIC_SITE_URL` and the `/auth/callback` route. Test login on the deployed URL, not only on localhost.
- Vercel Deployment Protection can block public access. Remind me to open the production URL in an incognito window.
- Login is Google only. Do not add email/password or magic links (they hit Supabase email rate limits).
- After any Vercel environment variable change, remind me to redeploy.
- Mailgun sandbox only sends to authorised recipients, so a failed send must never block saving an order.

## Communication
- Start each phase with a plan in at most 5 bullets.
- End each phase with the PASS/FAIL list and a short list of the manual steps I must do.
- Keep messages short and plain. Do not use em dashes.
