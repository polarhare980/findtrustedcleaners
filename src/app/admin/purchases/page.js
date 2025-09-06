import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import Purchase from '@/models/Purchase';
import { redirect } from 'next/navigation';
export const runtime = 'nodejs';
export default async function AdminPurchases() {
  const token = cookies().get('ftc_token')?.value; let u=null; try{u=jwt.verify(token||'',process.env.JWT_SECRET||'change_me');}catch{} if(!u||u.type!=='admin') redirect('/login?next=/admin/purchases');
  await dbConnect(); const rows = await Purchase.find({}, 'clientId cleanerId status day hour spanHours createdAt').sort({ createdAt:-1 }).lean();
  return (<div className="rounded-2xl p-4 border bg-white/70"><h3 className="font-medium mb-3">Purchases</h3><div className="space-y-2">{rows.map(r=>(<div key={String(r._id)} className="flex items-center justify-between border rounded-xl p-3 bg-white text-sm"><div><div>ID: {String(r._id)}</div><div>Cleaner: {String(r.cleanerId)} · Client: {String(r.clientId)}</div><div>Status: {r.status} · {r.day} {r.hour}:00 · span {r.spanHours}h</div></div></div>))}</div></div>);
}
