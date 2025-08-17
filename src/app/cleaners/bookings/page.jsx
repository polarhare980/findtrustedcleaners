'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

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

const STATUS_TABS = ['pending', 'accepted', 'rejected'];

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
          ? `/api/bookings/accept-order/${bookingId}`
          : `/api/bookings/accept-order/decline-order/${bookingId}`;

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
      className={`px-3 py-2 rounded-full text-sm border ${
        activeTab === id ? 'bg-black text-white border-black' : 'bg-transparent'
      }`}
    >
      {label} ({grouped[id]?.length || 0})
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All bookings</h1>
        <Link href="/cleaners/dashboard" className="underline">← Back to dashboard</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Tab id="pending" label="Pending" />
        <Tab id="accepted" label="Accepted" />
        <Tab id="rejected" label="Rejected" />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <p className="text-red-600">{err}</p>
      ) : (
        <div className="space-y-3">
          {(grouped[activeTab] || []).length === 0 ? (
            <div className="p-4 border rounded-xl">No bookings in this bucket.</div>
          ) : (
            grouped[activeTab].map((b) => (
              <div key={b._id} className="p-4 border rounded-xl flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">
                    {b.day || 'Day N/A'} {b.time ? `• ${b.time}` : ''}
                  </div>
                  <div className="text-sm opacity-80">
                    Requested: {formatCreated(b.createdAt)}
                    {typeof b.amount === 'number' ? ` • ${formatMoney(b.amount)}` : ''}
                  </div>
                  {b.clientId && (
                    <div className="text-sm opacity-80">
                      Client: {b.clientId.fullName || 'N/A'} {b.clientId.email ? `• ${b.clientId.email}` : ''}{' '}
                      {b.clientId.phone ? `• ${b.clientId.phone}` : ''}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => doAction(b._id, 'accept')}
                        disabled={!!busyId}
                        className="px-3 py-2 rounded-lg border"
                      >
                        {busyId === `${b._id}:accept` ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => doAction(b._id, 'decline')}
                        disabled={!!busyId}
                        className="px-3 py-2 rounded-lg border"
                      >
                        {busyId === `${b._id}:decline` ? 'Declining…' : 'Decline'}
                      </button>
                    </>
                  )}
                  {activeTab === 'accepted' && <span className="text-sm">Accepted ✅</span>}
                  {activeTab === 'rejected' && <span className="text-sm">Rejected ❌</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
