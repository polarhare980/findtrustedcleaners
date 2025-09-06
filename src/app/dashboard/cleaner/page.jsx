'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CleanerDashboard() {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const me = await meRes.json();
        if (!me?.success) {
          router.push('/login?next=/dashboard/cleaner');
          return;
        }
        setUser(me.user);

        const pRes = await fetch(`/api/cleaners/${me.user._id}/pending`, { credentials: 'include' });
        const pJson = await pRes.json();
        setPending(pJson?.purchases || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <main className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cleaner Dashboard</h1>
      <section>
        <h2 className="font-semibold mb-3">Pending bookings</h2>
        {pending.length === 0 ? (
          <p>No pending bookings yet.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map(p => (
              <li key={p._id} className="p-3 bg-white/70 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.day} at {String(p.hour).padStart(2,'0')}:00</div>
                  <div className="text-sm opacity-80">Client: {p.clientId}</div>
                </div>
                <div className="flex gap-2">
                  <form action={`/api/bookings/accept-order/${p._id}`} method="post">
                    <button className="px-3 py-1 rounded-lg bg-green-600 text-white">Accept</button>
                  </form>
                  <form action={`/api/bookings/accept-order/decline-order/${p._id}`} method="post">
                    <button className="px-3 py-1 rounded-lg bg-red-600 text-white">Decline</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
