'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import AccountShell from '@/components/AccountShell';

const fetchJson = async (url, opts = {}) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  if (!isJson) throw new Error('Unexpected response');
  const data = await res.json();
  if (!res.ok || data?.success === false) throw new Error(data?.message || data?.error || 'Request failed');
  return data;
};

const formatMoney = (n) => (typeof n === 'number' ? `£${n.toFixed(2)}` : '');
const formatCreated = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';


export default function CleanerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr('');
      // ✅ Uses your existing API
      const data = await fetchJson('/api/cleaners/bookings');
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (e) {
      setErr(e.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const g = { pending: [], accepted: [], rejected: [] };
    for (const b of bookings) (g[b.status] || (g[b.status] = [])).push(b);
    return g;
  }, [bookings]);

  const doAction = async (bookingId, action) => {
    try {
      setBusyId(`${bookingId}:${action}`);
      // ✅ Reuse your existing accept/decline routes
      const endpoint =
        action === 'accept'
          ? `/api/purchases/${bookingId}/approve`
          : `/api/purchases/${bookingId}/decline`;

      const res = await fetch(endpoint, { method: 'PUT', credentials: 'include' });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : {};
      if (!res.ok || data?.success === false) throw new Error(data?.message || 'Update failed');
      await load();
    } catch (e) {
      alert(e.message || 'Could not update booking');
    } finally {
      setBusyId(null);
    }
  };

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        activeTab === id
          ? 'bg-teal-600 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800'
      }`}
    >
      {label} ({grouped[id]?.length || 0})
    </button>
  );

  return (
    <AccountShell
      title="Cleaner bookings"
      description="Review pending jobs, keep track of accepted work, and manage declined requests in one place."
      backHref="/cleaners/dashboard"
      backLabel="Back to dashboard"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Tab id="pending" label="Pending" />
          <Tab id="accepted" label="Accepted" />
          <Tab id="rejected" label="Rejected" />
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
            <p className="font-medium text-slate-700">Loading bookings…</p>
          </div>
        ) : err ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            {err}
          </div>
        ) : (grouped[activeTab] || []).length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">
              📋
            </div>
            <p className="text-lg font-semibold text-slate-900">No bookings in this section</p>
            <p className="mt-2 text-sm text-slate-600">New booking requests will show here as they come in.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped[activeTab].map((b) => (
              <article
                key={b._id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
                        {activeTab}
                      </span>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {b.day || 'Day not set'}{b.time ? ` • ${b.time}` : ''}
                      </h2>
                      {typeof b.amount === 'number' ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                          {formatMoney(b.amount)}
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Requested</div>
                        <div className="mt-2 text-sm font-medium text-slate-800">{formatCreated(b.createdAt) || 'Not available'}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Client</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{b.clientId?.fullName || 'Not available'}</div>
                        <div className="mt-1 space-y-1 text-sm text-slate-600">
                          {b.clientId?.email ? <div>{b.clientId.email}</div> : null}
                          {b.clientId?.phone ? <div>{b.clientId.phone}</div> : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'pending' ? (
                    <div className="flex flex-col gap-3 sm:flex-row lg:w-[240px] lg:flex-col">
                      <button
                        onClick={() => doAction(b._id, 'accept')}
                        disabled={!!busyId}
                        className="inline-flex items-center justify-center rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === `${b._id}:accept` ? 'Accepting…' : 'Accept booking'}
                      </button>
                      <button
                        onClick={() => doAction(b._id, 'decline')}
                        disabled={!!busyId}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === `${b._id}:decline` ? 'Declining…' : 'Decline booking'}
                      </button>
                    </div>
                  ) : (
                    <div className="lg:w-[220px]">
                      <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${activeTab === 'accepted' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}`}>
                        {activeTab === 'accepted' ? 'Accepted booking' : 'Declined booking'}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AccountShell>
  );
}