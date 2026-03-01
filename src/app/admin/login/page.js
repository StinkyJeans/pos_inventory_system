"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "griddy-icons";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();
      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={32} className="text-amber-600" />
        <h1 className="text-2xl font-bold text-stone-800">Admin login</h1>
      </div>
      <p className="text-stone-600 mb-6">Sign in with your admin account to manage inventory and view sales.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-stone-700 mb-1">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
