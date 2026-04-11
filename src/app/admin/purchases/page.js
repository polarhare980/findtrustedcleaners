import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs';

export default async function AdminPurchases() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const user = token ? verifyToken(token) : null;

  if (!user || user.type !== 'admin') {
    redirect('/admin/login');
  }

  await dbConnect();
  const rows = await Purchase.find({}, 'clientId cleanerId status day hour spanHours createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="rounded-2xl border bg-white/70 p-4">
      <h3 className="mb-3 font-medium">Purchases</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={String(r._id)} className="flex items-center justify-between rounded-xl border bg-white p-3 text-sm">
            <div>
              <div>ID: {String(r._id)}</div>
              <div>Cleaner: {String(r.cleanerId)} · Client: {String(r.clientId)}</div>
              <div>Status: {r.status} · {r.day} {r.hour}:00 · span {r.spanHours}h</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
