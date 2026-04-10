'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AccountShell from '@/components/AccountShell';

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
    <AccountShell title="Your bookings" description="Track your requests, accepted jobs, and upcoming appointments." backHref="/clients/dashboard" backLabel="Back to dashboard">
      {loading ? <p className="text-slate-600">Loading bookings…</p> : error ? <p className="text-rose-700">{error}</p> : rows.length === 0 ? (
        <p className="text-slate-600">You do not have any bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{row.cleanerId?.companyName || row.cleanerId?.realName || 'Cleaner'}</div>
                  <div className="text-sm text-slate-600">{row.serviceName || row.serviceKey || 'Cleaning service'}</div>
                  <div className="text-sm text-slate-600">{row.isoDate || row.day} at {String(row.hour).padStart(2, '0')}:00</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200">{row.status}</span>
                  <Link href={`/cleaners/${row.cleanerId?._id || row.cleanerId || ''}`} className="ftc-button-primary">View cleaner</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
