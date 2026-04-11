import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Cleaner from '@/models/Cleaner';
import { redirect } from 'next/navigation';
import AdminReviewDeleteButton from '@/components/AdminReviewDeleteButton';

export const runtime = 'nodejs';

export default async function AdminReviews() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let u = null;
  try {
    u = jwt.verify(token || '', process.env.JWT_SECRET || 'change_me');
  } catch {}

  if (!u || u.type !== 'admin') redirect('/admin/login');

  await dbConnect();
  const rows = await Review.find({}, 'cleanerId rating text createdAt').sort({ createdAt: -1 }).limit(50).lean();
  const ids = Array.from(new Set(rows.map((r) => String(r.cleanerId))));
  const cleaners = await Cleaner.find({ _id: { $in: ids } }, 'slug realName companyName').lean();
  const cmap = Object.fromEntries(
    cleaners.map((c) => [String(c._id), { name: c.companyName || c.realName, slug: c.slug || String(c._id) }])
  );

  return (
    <div className="rounded-2xl border bg-white/70 p-4">
      <h3 className="mb-3 font-medium">Reviews</h3>
      <div className="space-y-2">
        {rows.map((r, idx) => (
          <ReviewRow key={idx} r={r} cleaner={cmap[String(r.cleanerId)]} id={String(r._id)} />
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ r, cleaner, id }) {
  return (
    <div className="flex items-start justify-between rounded-xl border bg-white p-3 text-sm">
      <div>
        <div className="font-medium">{cleaner?.name || String(r.cleanerId)} — {r.rating}/5</div>
        {r.text && <div className="mt-1 text-slate-700">{r.text}</div>}
        <div className="mt-1 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
      </div>
      <AdminReviewDeleteButton id={id} />
    </div>
  );
}
