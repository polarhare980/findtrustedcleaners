import { redirect } from "next/navigation";
import { getUserFromServerCookies } from "@/lib/auth";

export const runtime = "nodejs";

export default function AdminLayout({ children }) {
  const user = getUserFromServerCookies();

  // 🔐 Protect all /admin routes
  if (!user || user.type !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="container py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <nav className="flex gap-4 text-sm">
        <a className="underline" href="/admin">Overview</a>
        <a className="underline" href="/admin/users">Users</a>
        <a className="underline" href="/admin/cleaners">Cleaners</a>
        <a className="underline" href="/admin/purchases">Purchases</a>
        <a className="underline" href="/admin/reviews">Reviews</a>
        <a className="underline" href="/admin/marketing">Marketing</a>
        <a className="underline" href="/admin/blog">Blog</a>
      </nav>

      {children}
    </div>
  );
}
