"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Package } from "griddy-icons";
import { supabase } from "@/lib/supabase";

export function DashboardSnapshot() {
  const [todayOrders, setTodayOrders] = useState(null);
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
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("created_at", from),
        supabase.from("inventory").select("product_id, quantity, low_stock_threshold"),
      ]);

      setTodayOrders(ordersRes?.count ?? 0);

      const low = (invRes.data || []).filter(
        (row) => Number(row.quantity) <= Number(row.low_stock_threshold ?? 5)
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
      <p className="mt-1 text-sm text-stone-500">Your store at a glance.</p>
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
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <Package size={24} />
          </span>
          <div>
            <p className="text-2xl font-bold text-stone-800">{lowStockCount}</p>
            <p className="text-sm text-stone-500">Low stock items</p>
          </div>
        </div>
        {lowStockCount > 0 && (
          <Link
            href="/admin/inventory"
            className="self-center rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
          >
            Review inventory →
          </Link>
        )}
      </div>
    </div>
  );
}
