// src/app/admin/page.jsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export default async function AdminHome() {
  // Match your app-wide cookie name (COOKIE_NAME = 'token')
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const user = token ? verifyToken(token) : null;

  // Keep redirects inside /admin to avoid loops / missing pages
  if (!user || user.type !== 'admin') {
    redirect('/admin/login');
  }

  return <div className="text-sm">Welcome, admin.</div>;
}