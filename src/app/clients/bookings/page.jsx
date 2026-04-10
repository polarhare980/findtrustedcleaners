'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/DashboardShell';
import DashboardHeader from '@/components/DashboardHeader';

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
    <DashboardShell ctaHref="/clients/dashboard" ctaLabel="Dashboard">
      <DashboardHeader
        title="Your bookings"
        description="Keep track of upcoming appointments, cleaner responses, and completed work in one place."
        primaryHref="/cleaners"
        primaryLabel="Find a cleaner"
        secondaryHref="/clients/dashboard"
        secondaryLabel="Back to dashboard"
      />

      <section className="surface-card p-6 sm:p-8">
        {loading ? <p className="text-slate-600">Loading bookings…</p> : error ? <p className="text-rose-700">{error}</p> : rows.length === 0 ? (
          <div className="empty-state mt-0"><p>You do not have any bookings yet.</p></div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row._id} className="soft-panel p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{row.cleanerId?.companyName || row.cleanerId?.realName || 'Cleaner'}</div>
                    <div className="text-sm text-slate-600">{row.serviceName || row.serviceKey || 'Cleaning service'}</div>
                    <div className="mt-1 text-sm text-slate-500">{row.isoDate || row.day} at {String(row.hour).padStart(2, '0')}:00</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="status-badge bg-slate-100 text-slate-700">{row.status}</span>
                    <Link href={`/cleaners/${row.cleanerId?._id || row.cleanerId || ''}`} className="brand-button">View cleaner</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
