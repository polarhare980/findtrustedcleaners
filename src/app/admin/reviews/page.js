import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Cleaner from '@/models/Cleaner';
import { redirect } from 'next/navigation';
export const runtime = 'nodejs';
export default async function AdminReviews() {
  const token = cookies().get('ftc_token')?.value; let u=null; try{u=jwt.verify(token||'',process.env.JWT_SECRET||'change_me');}catch{} if(!u||u.type!=='admin') redirect('/login?next=/admin/reviews');
  await dbConnect();
  const rows = await Review.find({}, 'cleanerId rating text createdAt').sort({ createdAt: -1 }).limit(50).lean();
  const ids = Array.from(new Set(rows.map(r => String(r.cleanerId))));
  const cleaners = await Cleaner.find({ _id: { $in: ids }}, 'slug realName companyName').lean();
  const cmap = Object.fromEntries(cleaners.map(c => [String(c._id), { name: c.companyName || c.realName, slug: c.slug || String(c._id) }]));
  return (<div className="rounded-2xl p-4 border bg-white/70"><h3 className="font-medium mb-3">Reviews</h3><div className="space-y-2">{rows.map((r, idx)=>(<ReviewRow key={idx} r={r} cleaner={cmap[String(r.cleanerId)]} id={String(r._id)} />))}</div></div>);
}
function ReviewRow({ r, cleaner, id }) {
  return (<div className="flex items-start justify-between border rounded-xl p-3 bg-white text-sm"><div><div className="font-medium">{cleaner?.name || String(r.cleanerId)} — {r.rating}/5</div>{r.text && <div className="text-slate-700 mt-1">{r.text}</div>}<div className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleString()}</div></div><DeleteButton id={id} /></div>);
}
function DeleteButton({ id }) {
  async function del(){ if(!confirm('Delete this review?')) return; await fetch(`/api/admin/reviews/${id}`, { method:'DELETE', credentials:'include' }); location.reload(); }
  return <button className="px-2 py-1 rounded bg-rose-600 text-white" onClick={del}>Delete</button>;
}
