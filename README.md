# POS & Inventory for Cafes & Restaurants

A web-based **Point of Sale (POS)** and **inventory management** system with **barcode scanning**. Built with Next.js, Tailwind CSS, and Supabase.

## Features

- **POS** — Scan barcode (or type and Enter) to add items; price and available quantity shown. Complete sale to deduct quantity from inventory.
- **Admin → Inventory** — Scan barcode to view a product (name, price, quantity). Add new products (barcode required), update stock and prices, low-stock alerts.
- **Admin → Sales** — View orders, calculate sales by period (today / week / month), top-selling items by revenue.

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

3. **Environment**
   - Copy `.env.local.example` to `.env.local` and set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use **POS** for sales (barcode scan), **Admin** for inventory and sales reports.

## Deploy (e.g. Vercel)

1. Push the repo to GitHub and import it in [vercel.com](https://vercel.com).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in project Environment Variables.
3. Deploy. The app will be live at your Vercel URL.

## Project structure

- `src/app/` — Dashboard (`/`), POS (`/pos`), Admin (`/admin/inventory`, `/admin/sales`)
- `src/components/` — AppNav, AdminNav, DashboardSnapshot
- `src/lib/supabase.js` — Supabase client
- `supabase/schema.sql` — Full schema and seed (with barcodes)
- `supabase/migrations/001_add_barcode.sql` — Add barcode column to existing DB

## License

MIT.
# pos_inventory_system
