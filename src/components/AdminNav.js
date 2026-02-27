"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ChartBar, Settings } from "griddy-icons";

export function AdminNav() {
  const pathname = usePathname();
  const linkBase = "flex items-center gap-2 rounded-lg py-2 px-3 text-sm font-medium text-stone-600 no-underline hover:bg-stone-100 hover:text-stone-800";
  const linkActive = "bg-amber-100 text-amber-900 hover:bg-amber-100 hover:text-amber-900";

  return (
    <>
      <Link href="/admin" className="mb-4 block font-semibold text-stone-800 flex items-center gap-2">
        <Settings size={20} className="shrink-0 text-stone-600" />
        Admin
      </Link>
      <nav className="flex flex-col gap-1">
        <Link
          href="/admin/inventory"
          className={pathname === "/admin/inventory" ? `${linkBase} ${linkActive}` : linkBase}
        >
          <Package size={18} className="shrink-0" />
          Inventory
        </Link>
        <Link
          href="/admin/sales"
          className={pathname === "/admin/sales" ? `${linkBase} ${linkActive}` : linkBase}
        >
          <ChartBar size={18} className="shrink-0" />
          Sales
        </Link>
      </nav>
    </>
  );
}
