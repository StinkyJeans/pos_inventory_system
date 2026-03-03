# POS & Inventory for Cafes & Restaurants

A web-based **Point of Sale (POS)** and **inventory management** system with **barcode scanning**. Built with Next.js, Tailwind CSS, and Supabase.

## Features

- **POS** — Scan barcode (or type and Enter) to add items; price and available quantity shown. Complete sale to deduct quantity from inventory.
- **Admin** — Links open the separate **pos_admin** app (inventory, sales reports). Run pos_admin on port 3001 and set `NEXT_PUBLIC_ADMIN_URL` in `.env.local` if needed.

## Tech stack

- **Next.js 16** (App Router)
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL)

## Local setup

1. **Install**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run the contents of `supabase/schema.sql`.
   - If you already had the old schema (no `barcode` column), also run `supabase/migrations/001_add_barcode.sql`.
   - For **admin login**, run `supabase/migrations/002_profiles_and_roles.sql`. Then in Supabase: enable **Email** under Authentication → Providers, create a user (or use Sign up), then in SQL Editor run: `UPDATE public.profiles SET role = 'admin' WHERE user_id = 'YOUR_USER_UUID';` (find the UUID in Authentication → Users).

3. **Environment**
   - Copy `.env.local.example` to `.env.local` and set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use **POS** for sales (barcode scan). **Admin** opens the separate pos_admin app (run it on port 3001).

## Deploy (e.g. Vercel)

1. Push the repo to GitHub and import it in [vercel.com](https://vercel.com).
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `NEXT_PUBLIC_ADMIN_URL` in project Environment Variables.
3. Deploy. The app will be live at your Vercel URL.

## Project structure

- `src/app/` — Dashboard (`/`), POS (`/pos`), redirects to admin for `/inventory` and `/reports`
- `src/components/` — AppNav, DashboardSnapshot, RedirectToAdmin
- `src/lib/supabase.js` — Supabase client
- `supabase/schema.sql` — Full schema and seed (with barcodes)
- `supabase/migrations/001_add_barcode.sql` — Add barcode column to existing DB
- `supabase/migrations/002_profiles_and_roles.sql` — Profiles and roles for admin (used by pos_admin)

## License

MIT.
