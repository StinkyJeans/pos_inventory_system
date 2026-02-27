import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({ children }) {
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
