import Link from "next/link";
import { Monitor } from "griddy-icons";
import { DashboardSnapshot } from "@/components/DashboardSnapshot";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-stone-600">POS for sales and daily operations.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Link
          href="/pos"
          className="group rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <Monitor size={40} className="text-amber-600" />
          <h2 className="mt-4 text-xl font-semibold text-stone-800 group-hover:text-amber-800">POS</h2>
          <p className="mt-2 text-stone-600">Scan barcodes to add items. Complete sale to deduct from inventory.</p>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 sm:grid-cols-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-800">For cashiers</h2>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            <li>Scan or type barcode, then press Enter or click Add.</li>
            <li>Use + / − to adjust quantities in the current order.</li>
            <li>Click Complete sale to save the order and update stock.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-stone-800">Stock behaviour</h2>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            <li>Each sale deducts from inventory automatically.</li>
            <li>Low stock is flagged when quantity is at or below 50.</li>
            <li>Out-of-stock items can’t be added to the cart.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-stone-800">Tips</h2>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            <li>Keep the barcode field focused for faster scanning.</li>
            <li>Use notes on the POS screen to record special instructions.</li>
            <li>Check “At a glance” below to monitor today’s activity.</li>
          </ul>
        </div>
      </div>

      <DashboardSnapshot />
    </div>
  );
}
