"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { supabase } from "@/lib/supabase";

export function AdminGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // 'loading' | 'login' | 'denied' | 'ok'

  useEffect(() => {
    if (pathname === "/admin/login") {
      setStatus("login");
      return;
    }
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setStatus("denied");
        return;
      }
      setStatus("ok");
    }
    check();
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        {children}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-red-600">Access denied. This account is not an admin.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-48 shrink-0 border-r border-stone-200 bg-white py-6 px-4">
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1 flex justify-center py-6 px-6">
        <div className="w-full max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
