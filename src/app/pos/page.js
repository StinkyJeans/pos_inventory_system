"use client";

import { useRef, useEffect, useState } from "react";
import { BarcodeScan } from "griddy-icons";
import { supabase } from "@/lib/supabase";

export default function POSPage() {
  const barcodeInputRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [orderType, setOrderType] = useState("takeout");
  const [tableLabel, setTableLabel] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [barcodeError, setBarcodeError] = useState("");
  const [lastScanned, setLastScanned] = useState(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart.length, lastOrderId]);

  async function lookupByBarcode(barcode) {
    const trimmed = String(barcode).trim();
    if (!trimmed) return null;
    setBarcodeError("");
    const { data: product, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("barcode", trimmed)
      .eq("is_active", true)
      .maybeSingle();
    if (error) {
      setBarcodeError("Lookup failed.");
      return null;
    }
    if (!product) {
      setBarcodeError("Product not found for this barcode.");
      return null;
    }
    const { data: inv } = await supabase.from("inventory").select("quantity").eq("product_id", product.id).maybeSingle();
    const available = inv ? Number(inv.quantity) : 0;
    return { ...product, available };
  }

  async function handleBarcodeSubmit(e) {
    e.preventDefault();
    const input = e.currentTarget.elements?.barcode;
    const value = input?.value?.trim() || "";
    if (!value) return;
    input.value = "";
    const product = await lookupByBarcode(value);
    if (!product) return;
    setLastScanned({ name: product.name, price: product.price, available: product.available });
    const canAdd = product.available > 0;
    if (!canAdd) {
      setBarcodeError("Out of stock.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > product.available) return prev;
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: newQty, available: product.available } : i));
      }
      return [...prev, { ...product, quantity: 1, available: product.available }];
    });
  }

  function updateQty(id, delta) {
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.id !== id);
      if (newQty > (item.available ?? 0)) return prev;
      return prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i));
    });
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  const rawSubtotal = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const parsedDiscountValue = Number(discountValue || 0);
  const discountAmount = discountType === "percent"
    ? Math.min(rawSubtotal, Number((rawSubtotal * (parsedDiscountValue / 100)).toFixed(2)))
    : discountType === "fixed"
      ? Math.min(rawSubtotal, parsedDiscountValue)
      : 0;
  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + tax;

  async function checkout() {
    if (cart.length === 0) return;
    if (orderType === "dine_in" && !tableLabel.trim()) {
      setBarcodeError("Table number/name is required for dine-in orders.");
      return;
    }
    if (discountType === "percent" && parsedDiscountValue > 100) {
      setBarcodeError("Percent discount cannot be greater than 100.");
      return;
    }
    setCheckingOut(true);
    setBarcodeError("");
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          status: "completed",
          order_type: orderType,
          table_label: orderType === "dine_in" ? (tableLabel.trim() || null) : null,
          payment_method: paymentMethod,
          discount_type: discountType,
          discount_value: parsedDiscountValue || 0,
          discount_amount: discountAmount,
          subtotal: subtotal.toFixed(2),
          tax,
          total: total.toFixed(2),
          note: note || null,
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const items = cart.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: Number(i.price),
        line_total: (Number(i.price) * i.quantity).toFixed(2),
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      for (const item of cart) {
        const { data: inv } = await supabase.from("inventory").select("quantity").eq("product_id", item.id).single();
        if (inv) {
          const newQty = Math.max(0, Number(inv.quantity) - item.quantity);
          await supabase.from("inventory").update({ quantity: newQty, updated_at: new Date().toISOString() }).eq("product_id", item.id);
        }
      }

      setLastOrderId(order.id);
      setCart([]);
      setNote("");
      setLastScanned(null);
      setDiscountType("none");
      setDiscountValue("");
    } catch (e) {
      console.error(e);
      setBarcodeError("Checkout failed. Try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2">
        <BarcodeScan size={28} className="text-stone-700" />
        <h1 className="text-2xl font-bold text-stone-800">Point of Sale</h1>
      </div>
      <p className="mt-1 text-stone-600">Scan barcode or type barcode and press Enter. Quantity is deducted from inventory on sale.</p>

      <form onSubmit={handleBarcodeSubmit} className="mt-4">
        <label htmlFor="pos-barcode" className="sr-only">Barcode</label>
        <div className="flex gap-2">
          <input
            id="pos-barcode"
            ref={barcodeInputRef}
            name="barcode"
            type="text"
            autoComplete="off"
            placeholder="Scan or enter barcode"
            className="flex-1 rounded-xl border border-stone-300 px-4 py-3 text-lg font-mono focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button type="submit" className="rounded-xl bg-amber-500 px-6 py-3 font-medium text-white hover:bg-amber-600">
            Add
          </button>
        </div>
        {barcodeError && <p className="mt-2 text-sm text-red-600">{barcodeError}</p>}
        {lastScanned && !barcodeError && (
          <p className="mt-2 text-sm text-green-700">Added: {lastScanned.name} — ${Number(lastScanned.price).toFixed(2)} (stock: {lastScanned.available})</p>
        )}
      </form>

      {lastOrderId && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-800">
          Sale complete. Order ID: <code className="font-mono text-sm">{lastOrderId.slice(0, 8)}…</code>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold text-stone-800">Current order</h2>
          {cart.length === 0 ? (
            <p className="mt-4 text-stone-500">Cart is empty. Scan a barcode to add items.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {cart.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-4 border-b border-stone-100 pb-2">
                  <div>
                    <span className="font-medium text-stone-800">{i.name}</span>
                    <span className="ml-2 text-sm text-stone-500">× {i.quantity} (avail. {i.available ?? 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(i.id, -1)} className="h-8 w-8 rounded bg-stone-200 font-medium hover:bg-stone-300">−</button>
                    <span className="w-8 text-center">{i.quantity}</span>
                    <button type="button" onClick={() => updateQty(i.id, 1)} className="h-8 w-8 rounded bg-stone-200 font-medium hover:bg-stone-300">+</button>
                    <span className="font-mono w-20 text-right">${(Number(i.price) * i.quantity).toFixed(2)}</span>
                    <button type="button" onClick={() => removeFromCart(i.id)} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-4 py-3">
            <h2 className="font-semibold text-stone-800">Total</h2>
          </div>
          <div className="space-y-2 px-4 py-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-medium text-stone-700">
                Order type
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="dine_in">Dine-in</option>
                  <option value="takeout">Takeout</option>
                  <option value="delivery">Delivery</option>
                </select>
              </label>
              <label className="text-xs font-medium text-stone-700">
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="ewallet">E-wallet</option>
                </select>
              </label>
            </div>
            {orderType === "dine_in" && (
              <input
                type="text"
                placeholder="Table no. (e.g. T-8)"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-medium text-stone-700">
                Discount type
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="none">None</option>
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </label>
              <label className="text-xs font-medium text-stone-700">
                Discount value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={discountType === "none"}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-50 disabled:text-stone-400"
                  placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 2.50"}
                />
              </label>
            </div>
            <input
              type="text"
              placeholder="Order note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <div className="flex justify-between text-sm text-stone-600">
              <span>Items subtotal</span>
              <span className="font-mono">${rawSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-600">
              <span>Discount</span>
              <span className="font-mono">-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-600">
              <span>Subtotal after discount</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-600">
              <span>Tax (8%)</span>
              <span className="font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-stone-800">
              <span>Total</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={cart.length === 0 || checkingOut}
              className="mt-2 w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingOut ? "Processing…" : "Complete sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
