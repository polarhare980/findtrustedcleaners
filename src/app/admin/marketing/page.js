import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import AdminBroadcastForm from '@/components/AdminBroadcastForm';

export const runtime = 'nodejs';

export default async function AdminMarketing() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const user = token ? verifyToken(token) : null;

  if (!user || user.type !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-white/70 p-4">
      <h3 className="font-medium">Send broadcast</h3>
      <AdminBroadcastForm />
    </div>
  );
}
