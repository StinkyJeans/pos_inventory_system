"use client";

import { useEffect, useState } from "react";
import { ChartBar } from "griddy-icons";
import { supabase } from "@/lib/supabase";

export default function AdminSalesPage() {
  const [period, setPeriod] = useState("today");
  const [orders, setOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [summary, setSummary] = useState({ count: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const from = new Date();
      if (period === "today") from.setHours(0, 0, 0, 0);
      else if (period === "week") from.setDate(from.getDate() - 7);
      else if (period === "month") from.setMonth(from.getMonth() - 1);
      const fromIso = from.toISOString();

      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, total, created_at, status")
        .eq("status", "completed")
        .gte("created_at", fromIso)
        .order("created_at", { ascending: false });
      setOrders(ordersData || []);

      const count = (ordersData || []).length;
      const total = (ordersData || []).reduce((s, o) => s + Number(o.total), 0);
      setSummary({ count, total });

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("product_name, quantity, line_total")
        .gte("created_at", fromIso);
      const byName = {};
      (itemsData || []).forEach((row) => {
        if (!byName[row.product_name]) byName[row.product_name] = { name: row.product_name, quantity: 0, revenue: 0 };
        byName[row.product_name].quantity += row.quantity;
        byName[row.product_name].revenue += Number(row.line_total);
      });
      setTopItems(Object.values(byName).sort((a, b) => b.revenue - a.revenue).slice(0, 15));
      setLoading(false);
    }
    load();
  }, [period]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <ChartBar size={28} className="text-stone-700" />
        <h1 className="text-2xl font-bold text-stone-800">Sales</h1>
      </div>
      <p className="mt-1 text-stone-600">View sales and calculate totals by period.</p>

      <div className="mt-4 flex gap-2">
        {["today", "week", "month"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={"rounded-lg px-4 py-2 text-sm font-medium capitalize " + (period === p ? "bg-amber-200 text-amber-900" : "bg-stone-200 text-stone-700 hover:bg-stone-300")}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-stone-500">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-stone-800">Sales summary</h2>
              <p className="mt-2 text-3xl font-bold text-amber-700">{summary.count} orders</p>
              <p className="text-2xl font-mono text-stone-700">${summary.total.toFixed(2)} revenue</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-stone-800">Recent orders</h2>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                {orders.slice(0, 10).map((o) => (
                  <li key={o.id} className="flex justify-between">
                    <span className="text-stone-600">{new Date(o.created_at).toLocaleString()}</span>
                    <span className="font-mono">${Number(o.total).toFixed(2)}</span>
                  </li>
                ))}
                {orders.length === 0 && <li className="text-stone-500">No orders in this period.</li>}
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-stone-800">Top selling items (by revenue)</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="pb-2 font-semibold text-stone-800">Product</th>
                    <th className="pb-2 font-semibold text-stone-800">Units sold</th>
                    <th className="pb-2 font-semibold text-stone-800">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item) => (
                    <tr key={item.name} className="border-b border-stone-100">
                      <td className="py-2 font-medium text-stone-800">{item.name}</td>
                      <td className="py-2 font-mono text-stone-600">{item.quantity}</td>
                      <td className="py-2 font-mono text-stone-700">${item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topItems.length === 0 && <p className="py-6 text-center text-stone-500">No item data for this period.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
