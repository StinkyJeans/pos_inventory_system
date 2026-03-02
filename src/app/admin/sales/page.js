"use client";

import { useEffect, useState, useMemo } from "react";
import { ChartBar } from "griddy-icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import { ProductSoldModal } from "@/components/modal/productSold";
import { downloadSalesExcel } from "@/components/salesExcelExport";

export default function AdminSalesPage() {
  const [period, setPeriod] = useState("today");
  const [orders, setOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [summary, setSummary] = useState({ count: 0, total: 0 });
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productSoldModalOpen, setProductSoldModalOpen] = useState(false);
  const [topItemsPage, setTopItemsPage] = useState(1);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  const TOP_ITEMS_PER_PAGE = 20;
  const topItemsTotalPages = Math.max(1, Math.ceil(topItems.length / TOP_ITEMS_PER_PAGE));
  const paginatedTopItems = topItems.slice(
    (topItemsPage - 1) * TOP_ITEMS_PER_PAGE,
    topItemsPage * TOP_ITEMS_PER_PAGE
  );

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

      const [
        { data: itemsData },
        { data: productsData },
        { data: categoriesData },
      ] = await Promise.all([
        supabase.from("order_items").select("product_id, product_name, quantity, line_total").gte("created_at", fromIso),
        supabase.from("products").select("id, category_id"),
        supabase.from("categories").select("id, name").order("sort_order"),
      ]);

      const productToCategory = {};
      (productsData || []).forEach((p) => {
        productToCategory[p.id] = p.category_id;
      });
      const categoryNames = {};
      (categoriesData || []).forEach((c) => {
        categoryNames[c.id] = c.name;
      });

      const byName = {};
      const categoryMap = {};
      (itemsData || []).forEach((row) => {
        if (!byName[row.product_name]) byName[row.product_name] = { name: row.product_name, quantity: 0, revenue: 0 };
        byName[row.product_name].quantity += row.quantity;
        byName[row.product_name].revenue += Number(row.line_total);

        const catId = productToCategory[row.product_id] || null;
        const catName = catId ? categoryNames[catId] || "Uncategorized" : "Uncategorized";
        if (!categoryMap[catName]) categoryMap[catName] = { products: {}, total: 0 };
        if (!categoryMap[catName].products[row.product_name]) categoryMap[catName].products[row.product_name] = { quantity: 0, revenue: 0 };
        categoryMap[catName].products[row.product_name].quantity += row.quantity;
        categoryMap[catName].products[row.product_name].revenue += Number(row.line_total);
        categoryMap[catName].total += Number(row.line_total);
      });
      setTopItems(Object.values(byName).sort((a, b) => b.revenue - a.revenue));

      const categoryList = Object.entries(categoryMap).map(([name, data]) => ({
        name,
        products: Object.entries(data.products).map(([pName, p]) => ({ name: pName, quantity: p.quantity, revenue: p.revenue })),
        total: data.total,
      })).sort((a, b) => b.total - a.total);
      setByCategory(categoryList);
      setLoading(false);
    }
    load();
  }, [period]);

  useEffect(() => {
    setTopItemsPage(1);
  }, [period]);

  useEffect(() => {
    if (topItemsPage > topItemsTotalPages && topItemsTotalPages >= 1) setTopItemsPage(1);
  }, [topItemsPage, topItemsTotalPages]);

  const chartData = useMemo(() => {
    const byDate = {};
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { date: key, label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), revenue: 0, orders: 0 };
      byDate[key].revenue += Number(o.total);
      byDate[key].orders += 1;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <ChartBar size={28} className="text-stone-700" />
        <h1 className="text-2xl font-bold text-stone-800">Sales</h1>
      </div>
      <p className="mt-1 text-stone-600">View sales and calculate totals by period.</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
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
        {!loading && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
              className="flex items-center gap-1 rounded-lg border border-green-600 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
            >
              Download as Excel
              <span className="text-xs">▾</span>
            </button>
            {showDownloadDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDownloadDropdown(false)} aria-hidden />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                  <button type="button" onClick={() => { setShowDownloadDropdown(false); downloadSalesExcel("today"); }} className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">
                    Download today&apos;s sales
                  </button>
                  <button type="button" onClick={() => { setShowDownloadDropdown(false); downloadSalesExcel("week"); }} className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">
                    Download this week&apos;s sales
                  </button>
                  <button type="button" onClick={() => { setShowDownloadDropdown(false); downloadSalesExcel("month"); }} className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">
                    Download this month&apos;s sales
                  </button>
                  <button type="button" onClick={() => { setShowDownloadDropdown(false); downloadSalesExcel("all"); }} className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">
                    Download all sales
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-6 text-stone-500">Loading…</p>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-stone-800 mb-4">Sales by day</h2>
            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-stone-600" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} labelFormatter={(label) => label} />
                    <Bar dataKey="revenue" fill="rgb(245 158 11)" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-stone-500 py-8 text-center">No sales in this period.</p>
            )}
          </div>

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
            <h2 className="font-semibold text-stone-800">Products sold by category</h2>
            <p className="mt-1 text-sm text-stone-500">Quantity and total amount per product, grouped by category.</p>
            <button
              type="button"
              onClick={() => setProductSoldModalOpen(true)}
              className="mt-4 rounded-xl bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
            >
              View products by category
            </button>
          </div>

          <ProductSoldModal
            open={productSoldModalOpen}
            onClose={() => setProductSoldModalOpen(false)}
            byCategory={byCategory}
            periodLabel={period === "today" ? "Today" : period === "week" ? "Last 7 days" : "Last 30 days"}
          />

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
                  {paginatedTopItems.map((item) => (
                    <tr key={item.name} className="border-b border-stone-100">
                      <td className="py-2 font-medium text-stone-800">{item.name}</td>
                      <td className="py-2 font-mono text-stone-600">{item.quantity}</td>
                      <td className="py-2 font-mono text-stone-700">${item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topItems.length === 0 && <p className="py-6 text-center text-stone-500">No item data for this period.</p>}
              {topItems.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 text-sm">
                  <span className="text-stone-600">
                    Showing {(topItemsPage - 1) * TOP_ITEMS_PER_PAGE + 1}–{Math.min(topItemsPage * TOP_ITEMS_PER_PAGE, topItems.length)} of {topItems.length} items
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTopItemsPage((p) => Math.max(1, p - 1))}
                      disabled={topItemsPage <= 1}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="font-medium text-stone-800">
                      Page {topItemsPage} of {topItemsTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTopItemsPage((p) => Math.min(topItemsTotalPages, p + 1))}
                      disabled={topItemsPage >= topItemsTotalPages}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
