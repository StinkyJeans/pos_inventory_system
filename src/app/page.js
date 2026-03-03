import Link from "next/link";
import { Monitor, Settings } from "griddy-icons";
import { DashboardSnapshot } from "@/components/DashboardSnapshot";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-stone-600">POS for sales. Admin for inventory and sales reports.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Link
          href="/pos"
          className="group rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <Monitor size={40} className="text-amber-600" />
          <h2 className="mt-4 text-xl font-semibold text-stone-800 group-hover:text-amber-800">POS</h2>
          <p className="mt-2 text-stone-600">Scan barcodes to add items. Complete sale to deduct from inventory.</p>
        </Link>
        <a
          href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <Settings size={40} className="text-amber-600" />
          <h2 className="mt-4 text-xl font-semibold text-stone-800 group-hover:text-amber-800">Admin</h2>
          <p className="mt-2 text-stone-600">View sales, manage inventory, add products (with barcode), update stock and prices.</p>
        </a>
      </div>

      <DashboardSnapshot />
    </div>
  );
}
