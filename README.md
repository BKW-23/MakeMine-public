# MakeMine

MakeMine is a Vite/React storefront backed by Supabase and Vercel serverless
functions. The browser uses only the Supabase anon key. Customer/order lookups,
admin operations, and Gemini calls run through controlled server endpoints.

## Setup

1. Install Node.js 20+.
2. Install dependencies with `pnpm install` or `npm install`.
3. For a new Supabase project, apply
   `supabase/migrations/001_init.sql`, then
   `supabase/migrations/002_security_hardening.sql`.
   If `public.profiles` (or the other tables) already exists, do not run
   `001_init.sql` again; it has already been applied. Run only the hardening
   migration if it has not been applied yet.
4. Run `supabase/seed.sql` to add or update the sample catalog. The seed uses
   the product slug as a conflict key, so it can be re-run without creating a
   duplicate sample.
5. Start the frontend with `npm run dev`.

Các payload thử nghiệm chưa thuộc runtime chính nằm trong
[pending-review](pending-review). Thư mục này có script Bash để bật local và
tài liệu riêng cho `gift.json` và `order.json`.

## Environment variables

Client-side (safe to expose):

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Vercel server-only variables (never prefix with `VITE_`):

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

Set all five variables for Vercel Production, redeploy, and add the deployed
Vercel origin to Supabase Auth redirect URLs. Promote an account to admin only
after registration by updating its `profiles.role` in Supabase.

## Checks

```bash
npm run build
npm run lint
```

The `api/` directory contains Vercel functions. Secrets are read only from
server-side environment variables and are never imported into the browser build.
