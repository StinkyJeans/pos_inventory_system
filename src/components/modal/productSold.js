"use client";

import { useEffect } from "react";

export function ProductSoldModal({ open, onClose, byCategory, periodLabel }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const grandTotal = byCategory.reduce((s, c) => s + c.total, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-sold-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 id="product-sold-modal-title" className="text-xl font-bold text-stone-800">
              Products sold by category
            </h2>
            {periodLabel && (
              <p className="mt-0.5 text-sm text-stone-500">{periodLabel}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-5rem)] px-6 py-4">
          <p className="text-sm text-stone-500 mb-4">
            Quantity and total amount per product, grouped by category.
          </p>
          {byCategory.length > 0 ? (
            <div className="space-y-6">
              {byCategory.map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-xl border border-stone-200 bg-stone-50/50 overflow-hidden"
                >
                  <div className="px-4 py-2 bg-stone-100 font-semibold text-stone-800">
                    {cat.name}
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-white/80">
                        <th className="px-4 py-2 font-semibold text-stone-800">Product</th>
                        <th className="px-4 py-2 font-semibold text-stone-800 text-right">Qty</th>
                        <th className="px-4 py-2 font-semibold text-stone-800 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.products.map((p) => (
                        <tr key={p.name} className="border-b border-stone-100">
                          <td className="px-4 py-2 font-medium text-stone-800">{p.name}</td>
                          <td className="px-4 py-2 font-mono text-stone-600 text-right">
                            {p.quantity}
                          </td>
                          <td className="px-4 py-2 font-mono text-stone-700 text-right">
                            ${p.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex justify-end gap-6 text-sm font-semibold text-stone-800">
                    <span>Category total:</span>
                    <span className="font-mono">${cat.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 flex justify-end gap-6 text-base font-bold text-stone-800">
                <span>Total (all products):</span>
                <span className="font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-stone-500">
              No products sold in this period.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
