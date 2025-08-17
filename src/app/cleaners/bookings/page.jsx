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
      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ease-out backdrop-blur-lg ${
        activeTab === id 
          ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg transform -translate-y-1' 
          : 'bg-white/25 border border-white/20 text-teal-800 hover:bg-white/35 hover:transform hover:-translate-y-1 hover:shadow-md'
      }`}
    >
      {label} ({grouped[id]?.length || 0})
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900/20 via-teal-800/10 to-teal-700/20">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header Section */}
        <div className="mb-12 animate-fade-in">
          <div className="backdrop-blur-xl bg-white/25 border border-white/20 rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                All Bookings
              </h1>
              <Link 
                href="/cleaners/dashboard" 
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-lg hover:scale-105"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 animate-slide-up">
          <Tab id="pending" label="Pending" />
          <Tab id="accepted" label="Accepted" />
          <Tab id="rejected" label="Rejected" />
        </div>

        {/* Content Area */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {loading ? (
            <div className="backdrop-blur-xl bg-white/25 border border-white/20 rounded-3xl p-12 text-center shadow-xl">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-teal-800 font-medium">Loading bookings...</p>
            </div>
          ) : err ? (
            <div className="backdrop-blur-xl bg-red-50/80 border border-red-200/50 rounded-3xl p-8 shadow-xl">
              <p className="text-red-700 font-medium text-center">{err}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(grouped[activeTab] || []).length === 0 ? (
                <div className="backdrop-blur-xl bg-white/25 border border-white/20 rounded-3xl p-12 text-center shadow-xl">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-xl text-teal-800 font-medium">No bookings in this category</p>
                  <p className="text-teal-600 mt-2">Check back later for new requests!</p>
                </div>
              ) : (
                grouped[activeTab].map((b, index) => (
                  <div 
                    key={b._id} 
                    className="backdrop-blur-xl bg-white/25 border border-white/20 rounded-3xl p-6 md:p-8 shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:bg-white/35"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Booking Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-600 to-teal-700"></div>
                          <h3 className="text-xl font-bold text-teal-800">
                            {b.day || 'Day N/A'} {b.time ? `• ${b.time}` : ''}
                          </h3>
                        </div>
                        
                        <div className="backdrop-blur-sm bg-white/20 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-teal-700">
                            <span className="text-sm">📅</span>
                            <span className="font-medium">Requested: {formatCreated(b.createdAt)}</span>
                            {typeof b.amount === 'number' && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="font-bold text-teal-800">{formatMoney(b.amount)}</span>
                              </>
                            )}
                          </div>
                          
                          {b.clientId && (
                            <div className="flex items-start gap-2 text-teal-700">
                              <span className="text-sm mt-0.5">👤</span>
                              <div className="space-y-1">
                                <div className="font-medium text-teal-800">
                                  {b.clientId.fullName || 'N/A'}
                                </div>
                                <div className="text-sm space-x-4">
                                  {b.clientId.email && (
                                    <span className="inline-flex items-center gap-1">
                                      📧 {b.clientId.email}
                                    </span>
                                  )}
                                  {b.clientId.phone && (
                                    <span className="inline-flex items-center gap-1">
                                      📞 {b.clientId.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:min-w-[200px]">
                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => doAction(b._id, 'accept')}
                              disabled={!!busyId}
                              className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {busyId === `${b._id}:accept` ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Accepting...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  ✅ Accept Booking
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => doAction(b._id, 'decline')}
                              disabled={!!busyId}
                              className="px-6 py-3 rounded-full border-2 border-red-300 text-red-700 font-medium transition-all duration-300 hover:bg-red-50 hover:border-red-400 hover:transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {busyId === `${b._id}:decline` ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                  Declining...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  ❌ Decline
                                </span>
                              )}
                            </button>
                          </>
                        )}
                        {activeTab === 'accepted' && (
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium">
                            ✅ Accepted
                          </div>
                        )}
                        {activeTab === 'rejected' && (
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-100 border border-red-300 text-red-700 font-medium">
                            ❌ Rejected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}