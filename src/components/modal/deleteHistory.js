"use client";

import { useEffect } from "react";

export function DeleteHistoryModal({ open, onClose, inactiveProducts, onRestore }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-history-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 id="delete-history-modal-title" className="text-xl font-bold text-stone-800">
              Delete history
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              Restore a product to make it appear in inventory and POS again.
            </p>
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
          {!inactiveProducts?.length ? (
            <div className="py-12 text-center text-stone-500">No deactivated products.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200">
                <tr>
                  <th className="pb-2 font-semibold text-stone-800">Product</th>
                  <th className="pb-2 font-semibold text-stone-800">Barcode</th>
                  <th className="pb-2 font-semibold text-stone-800">Category</th>
                  <th className="pb-2 font-semibold text-stone-800">Price</th>
                  <th className="pb-2 font-semibold text-stone-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inactiveProducts.map((p) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="py-3 font-medium text-stone-800">{p.name}</td>
                    <td className="py-3 font-mono text-stone-600">{p.barcode || "—"}</td>
                    <td className="py-3 text-stone-600">{p.categories?.name ?? "—"}</td>
                    <td className="py-3 font-mono text-stone-600">${Number(p.price).toFixed(2)}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => onRestore(p)}
                        className="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
