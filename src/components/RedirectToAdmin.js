"use client";

import { useEffect } from "react";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";

export function RedirectToAdmin({ path = "" }) {
  useEffect(() => {
    const url = path ? `${adminUrl}/${path.replace(/^\//, "")}` : adminUrl;
    window.location.href = url;
  }, [path]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-stone-500">Redirecting to Admin…</p>
    </div>
  );
}
