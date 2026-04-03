import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyToken(token) : null;

  return (
    <div className="container py-6 space-y-4">
      {user?.type === "admin" ? (
      <nav className="flex flex-wrap gap-4 text-sm mb-6 p-3 bg-gray-900 text-white rounded-xl">
        <a className="font-semibold text-teal-400" href="/admin">Overview</a>
        <a className="hover:text-teal-300" href="/admin/users">Users</a>
        <a className="hover:text-teal-300" href="/admin/cleaners">Cleaners</a>
        <a className="hover:text-teal-300" href="/admin/purchases">Purchases</a>
        <a className="hover:text-teal-300" href="/admin/reviews">Reviews</a>
        <a className="hover:text-teal-300" href="/admin/marketing">Marketing</a>
        <a className="hover:text-teal-300 font-semibold" href="/admin/blog">Blog</a>
        <form action="/api/admin/logout" method="post" className="ml-auto">
          <button className="text-red-400 hover:text-red-300">Logout</button>
        </form>
      </nav>
      ) : null}
      {children}
    </div>
  );
}