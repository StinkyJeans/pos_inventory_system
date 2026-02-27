"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "griddy-icons";

const mainLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/pos", label: "POS" },
  { href: "/admin", label: "Admin" },
];

export function AppNav() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-800">
          <Store size={24} className="text-stone-700" />
          <span>POS & Inventory</span>
        </Link>
        <div className="flex gap-1">
          {mainLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                (href === "/" ? pathname === "/" : pathname === href || (href === "/admin" && isAdmin))
                  ? "bg-amber-100 text-amber-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
