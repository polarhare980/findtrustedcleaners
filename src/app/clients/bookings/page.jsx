'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClientBookingsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/clients/purchases', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load bookings');
        setRows(Array.isArray(data.purchases) ? data.purchases : []);
      } catch (e) {
        if (live) setError(e.message || 'Failed to load bookings');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-teal-800">Your Bookings</h1>
            <Link href="/clients/dashboard" className="px-4 py-2 rounded-xl bg-teal-600 text-white">Back to dashboard</Link>
          </div>

          {loading ? <p>Loading…</p> : error ? <p className="text-red-600">{error}</p> : rows.length === 0 ? (
            <p className="text-gray-700">You do not have any bookings yet.</p>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row._id} className="bg-white/80 rounded-2xl p-4 border border-white/30">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="font-semibold text-teal-800">{row.cleanerId?.companyName || row.cleanerId?.realName || 'Cleaner'}</div>
                      <div className="text-sm text-gray-600">{row.serviceName || row.serviceKey || 'Cleaning service'}</div>
                      <div className="text-sm text-gray-600">{row.isoDate || row.day} at {String(row.hour).padStart(2, '0')}:00</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">{row.status}</span>
                      <Link href={`/cleaners/${row.cleanerId?._id || row.cleanerId || ''}`} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm">View cleaner</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
