import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { redirect } from 'next/navigation';
export const runtime = 'nodejs';
export default async function AdminUsers() {
  const token = cookies().get('ftc_token')?.value; let u = null;
  try { u = jwt.verify(token || '', process.env.JWT_SECRET || 'change_me'); } catch {}
  if (!u || u.type !== 'admin') redirect('/login?next=/admin/users');
  await dbConnect();
  const users = await User.find({}, 'email type emailVerified createdAt').sort({ createdAt: -1 }).lean();
  return (<div className="rounded-2xl p-4 border bg-white/70"><h3 className="font-medium mb-3">Users</h3>
    <div className="space-y-2">{users.map(x => (<div key={String(x._id)} className="flex items-center justify-between border rounded-xl p-3 bg-white text-sm">
      <div><div className="font-medium">{x.email}</div><div>Type: {x.type} · Verified: {String(x.emailVerified)}</div></div></div>))}</div></div>);
}
