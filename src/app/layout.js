import "./globals.css";
import { AppNav } from "@/components/AppNav";

export const metadata = {
  title: "POS & Inventory | Cafe & Restaurant",
  description: "Point of sale and inventory management for cafes and restaurants",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-stone-50 text-stone-900 font-sans">
        <AppNav />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
