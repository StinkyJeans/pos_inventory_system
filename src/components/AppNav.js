"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "griddy-icons";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";

const mainLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/pos", label: "POS" },
  { href: adminUrl, label: "Admin", external: true },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-800">
          <Store size={24} className="text-stone-700" />
          <span>POS & Inventory</span>
        </Link>
        <div className="flex gap-2">
          {mainLinks.map(({ href, label, external }) =>
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === href ? "bg-amber-100 text-amber-900" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {label}
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
