 "use client";

import { useEffect, useState } from "react";
import { Receipt, Package } from "griddy-icons";
import { supabase } from "@/lib/supabase";

export function DashboardSnapshot() {
  const [todayOrders, setTodayOrders] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const from = today.toISOString();

      const [ordersRes, invRes] = await Promise.all([
        supabase
          .from("orders")
          .select("total", { count: "exact" })
          .eq("status", "completed")
          .gte("created_at", from),
        supabase.from("inventory").select("product_id, quantity, low_stock_threshold"),
      ]);

      setTodayOrders(ordersRes?.count ?? 0);

      const revenue = (ordersRes.data || []).reduce(
        (sum, row) => sum + Number(row.total ?? 0),
        0
      );
      setTodayRevenue(revenue);

      const low = (invRes.data || []).filter(
        (row) => Number(row.quantity) <= Number(row.low_stock_threshold ?? 50)
      ).length;
      setLowStockCount(low);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold text-stone-800">At a glance</h2>
        <p className="mt-2 text-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-stone-800">At a glance</h2>
      <p className="mt-1 text-sm text-stone-500">Today’s quick snapshot from this POS.</p>
      <div className="mt-4 flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Receipt size={24} />
          </span>
          <div>
            <p className="text-2xl font-bold text-stone-800">{todayOrders}</p>
            <p className="text-sm text-stone-500">Orders today</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Receipt size={24} />
          </span>
          <div>
            <p className="text-2xl font-bold text-stone-800">
              {todayRevenue != null ? `$${todayRevenue.toFixed(2)}` : "—"}
            </p>
            <p className="text-sm text-stone-500">Revenue today</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <Package size={24} />
          </span>
          <div>
            <p className="text-2xl font-bold text-stone-800">{lowStockCount}</p>
            <p className="text-sm text-stone-500">Low stock items</p>
          </div>
        </div>
        {lowStockCount > 0 && (
          <p className="self-center text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            Low stock items are tracked here for reference. Adjust inventory levels from the admin system.
          </p>
        )}
      </div>
    </div>
  );
}
