import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import { redirect } from 'next/navigation';
import AdminCleanerRow from '@/components/AdminCleanerRow';
export const runtime = 'nodejs';
export default async function AdminCleaners() {
  const token = cookies().get('ftc_token')?.value; let u = null; try { u = jwt.verify(token || '', process.env.JWT_SECRET || 'change_me'); } catch {}
  if (!u || u.type !== 'admin') redirect('/login?next=/admin/cleaners');
  await dbConnect();
  const rows = await Cleaner.find({}, 'slug realName companyName ratingAvg ratingCount createdAt isVisible').sort({ createdAt: -1 }).lean();
  return (<div className="rounded-2xl p-4 border bg-white/70"><h3 className="font-medium mb-3">Cleaners</h3><div className="space-y-2">{rows.map(r => (<AdminCleanerRow key={String(r._id)} row={r} />))}</div></div>);
}
