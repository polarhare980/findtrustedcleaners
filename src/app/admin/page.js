import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
export const runtime = 'nodejs';
export default async function AdminHome() {
  const token = cookies().get('ftc_token')?.value; let user = null;
  try { user = jwt.verify(token || '', process.env.JWT_SECRET || 'change_me'); } catch {}
  if (!user || user.type !== 'admin') redirect('/login?next=/admin');
  return <div className="text-sm">Welcome, admin.</div>;
}
