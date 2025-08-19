'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { injectPendingFromPurchases, hasContiguousAvailability, requiredHourSpan } from '@/lib/availability';

// Public APIs
const PUBLIC_CLEANER_API = (id) => `/api/public-cleaners/${id}`;
const PUBLIC_PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;

// Client APIs
const CREATE_PURCHASE_API = '/api/clients/purchases';
const CONTACT_UNLOCK_API = '/api/clients/contact-unlock';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7..19

/* ----------------------------- Utility Helpers ---------------------------- */

function normalizePhotos(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => (typeof p === 'string' ? { url: p } : p))
    .filter((p) => p?.url);
}

function isSafeEmbed(code = '') {
  const lower = String(code).toLowerCase();
  const hasIframe = lower.includes('<iframe') && lower.includes('src=');
  const forbidden = ['<script', '<style', 'onerror', 'onload', 'javascript:'];
  return hasIframe && !forbidden.some((frag) => lower.includes(frag));
}

function labelForHour(h) {
  const hh = String(h).padStart(2, '0');
  return `${hh}:00`;
}

/* ------------------------------- Main Page ------------------------------- */

export default function CleanerProfilePage() {
  const router = useRouter();
  const { id } = useParams();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cleaner, setCleaner] = useState(null);
  const [error, setError] = useState('');

  // contact unlock
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);

  // booking controls
  const [selectedServiceKey, setSelectedServiceKey] = useState('');
  const [durationMins, setDurationMins] = useState(60);
  const [bufferBeforeMins, setBufferBeforeMins] = useState(0);
  const [bufferAfterMins, setBufferAfterMins] = useState(0);

  const [selectedDay, setSelectedDay] = useState('');
  const [selectedHour, setSelectedHour] = useState(null); // number
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => setMounted(true), []);

  /* ------------------------------ Data Fetch ------------------------------ */

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError('');

        // 1) public cleaner
        const res = await fetch(PUBLIC_CLEANER_API(id), { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data?.success || !data.cleaner) {
          throw new Error(data?.message || 'Cleaner not found.');
        }
        let c = data.cleaner;

        // 2) purchases feed -> inject pending/accepted into grid
        try {
          const pRes = await fetch(PUBLIC_PURCHASES_API(c._id), { credentials: 'include' });
          const p = await pRes.json();
          if (p?.success) {
            c = {
              ...c,
              availability: injectPendingFromPurchases(c.availability || {}, p.purchases || []),
            };
          }
        } catch {
          // ignore: fall back to raw availability
        }

        c.photos = normalizePhotos(c.photos);
        if (!cancelled) {
          setCleaner(c);

          // Prime booking controls from first active serviceDetailed
          const firstActive = (c.servicesDetailed || []).find((s) => s.active !== false);
          if (firstActive) {
            setSelectedServiceKey(firstActive.key);
            setDurationMins(firstActive.defaultDurationMins ?? 60);
            setBufferBeforeMins(firstActive.bufferBeforeMins ?? 0);
            setBufferAfterMins(firstActive.bufferAfterMins ?? 0);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  /* ---------------------------- Derived Values ---------------------------- */

  const service = useMemo(() => {
    if (!cleaner) return null;
    return (cleaner.servicesDetailed || []).find((s) => s.key === selectedServiceKey) || null;
  }, [cleaner, selectedServiceKey]);

  const increment = useMemo(() => {
    return service?.incrementMins ?? 60;
  }, [service]);

  const minDuration = useMemo(() => service?.minDurationMins ?? 60, [service]);
  const maxDuration = useMemo(() => service?.maxDurationMins ?? 240, [service]);

  // Span required for this booking config
  const span = useMemo(
    () => requiredHourSpan({ durationMins, bufferBeforeMins, bufferAfterMins }),
    [durationMins, bufferBeforeMins, bufferAfterMins]
  );

  const canSelectStart = useMemo(() => {
    if (!cleaner || !selectedDay || selectedHour == null) return false;
    if (selectedHour + span > 24) return false;
    return hasContiguousAvailability(cleaner.availability || {}, selectedDay, selectedHour, span);
  }, [cleaner, selectedDay, selectedHour, span]);

  /* ---------------------------- Contact Unlock ---------------------------- */

  useEffect(() => {
    if (!cleaner) return;

    (async () => {
      setUnlockLoading(true);
      try {
        const res = await fetch(CONTACT_UNLOCK_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ cleanerId: cleaner._id }),
        });
        const j = await res.json();
        setContactUnlocked(res.ok && j?.success && (j.unlocked === true || j.status === 'accepted'));
        if (res.ok && j?.success && j.phone) {
          // enrich cleaner with contacts if returned
          setCleaner((prev) => ({ ...prev, phone: j.phone, email: j.email }));
        }
      } catch {
        setContactUnlocked(false);
      } finally {
        setUnlockLoading(false);
      }
    })();
  }, [cleaner?._id]);

  /* ----------------------------- Event Handlers --------------------------- */

  function selectCell(day, hour) {
    setSelectedDay(day);
    setSelectedHour(hour);
  }

  async function createBooking() {
    if (!cleaner?._id) return;
    if (!selectedDay || selectedHour == null) {
      setToast('Please select a start time.');
      return;
    }
    if (!service) {
      setToast('Please choose a service.');
      return;
    }
    if (!canSelectStart) {
      setToast('Selected start time cannot fit the required duration.');
      return;
    }

    setCreating(true);
    setToast('');
    try {
      const res = await fetch(CREATE_PURCHASE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cleanerId: cleaner._id,
          day: selectedDay,
          hour: selectedHour, // number
          serviceKey: service.key,
          durationMins,
          bufferBeforeMins,
          bufferAfterMins,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.success) {
        throw new Error(j?.message || 'Failed to create booking.');
      }
      setToast('Booking request sent! Awaiting cleaner approval.');
      // Optionally refresh purchases overlay
      try {
        const pRes = await fetch(PUBLIC_PURCHASES_API(cleaner._id), { credentials: 'include' });
        const p = await pRes.json();
        if (p?.success) {
          setCleaner((prev) => ({
            ...prev,
            availability: injectPendingFromPurchases(prev.availability || {}, p.purchases || []),
          }));
        }
      } catch {}
    } catch (e) {
      setToast(e.message || 'Booking failed.');
    } finally {
      setCreating(false);
      // Scroll to top toast
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* -------------------------------- Render -------------------------------- */

  if (!mounted) return null;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/20 to-teal-700/10">
        <div className="text-center text-teal-800">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700 mx-auto mb-3" />
          Loading profile…
        </div>
      </main>
    );
  }

  if (error || !cleaner) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900/20 to-teal-700/10">
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-semibold text-red-700 mb-2">Error</h1>
          <p className="text-gray-700 mb-4">{error || 'Cleaner not found.'}</p>
          <Link href="/" className="inline-block px-5 py-2 rounded-full bg-teal-700 text-white">Back home</Link>
        </div>
      </main>
    );
  }

  const isInsured = !!cleaner.businessInsurance;
  const dbsChecked = !!cleaner.dbsChecked;

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Toast */}
        {toast && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-3">
            {toast}
          </div>
        )}

        {/* Header Card */}
        <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          <div className="flex items-start gap-6">
            <div className="relative">
              <img
                src={cleaner.image?.trim() ? cleaner.image : '/default-avatar.png'}
                alt={cleaner.companyName || cleaner.realName || 'Cleaner'}
                className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-2xl border-4 border-white/30"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                {cleaner.companyName || cleaner.realName}
              </h1>

              <div className="flex flex-wrap gap-2 mt-3">
                {cleaner.isPremium && (
                  <span className="text-xs text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                    ✨ Premium
                  </span>
                )}
                {isInsured && (
                  <span className="text-xs text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                    ✔ Insured
                  </span>
                )}
                {dbsChecked && (
                  <span className="text-xs text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>
                    ✔ DBS Checked
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <div className="bg-white/50 rounded-2xl p-3 border border-white/30">
                  <div className="font-semibold text-teal-800">📍 Postcode</div>
                  <div className="text-lg">{cleaner.address?.postcode || '—'}</div>
                </div>
                <div className="bg-white/50 rounded-2xl p-3 border border-white/30">
                  <div className="font-semibold text-teal-800">💷 Hourly Rate</div>
                  <div className="text-lg">£{typeof cleaner.rates === 'number' ? cleaner.rates : '—'}/hr</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact unlock */}
        <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          {unlockLoading ? (
            <div className="text-center text-gray-700">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mx-auto mb-3" />
              Checking booking status…
            </div>
          ) : contactUnlocked ? (
            <div className="grid sm:grid-cols-3 gap-4 text-gray-800">
              <div><div className="text-teal-700 font-semibold">📞 Phone</div><div>{cleaner.phone || '—'}</div></div>
              <div><div className="text-teal-700 font-semibold">📧 Email</div><div>{cleaner.email || '—'}</div></div>
              <div><div className="text-teal-700 font-semibold">🏢 Company</div><div>{cleaner.companyName || cleaner.realName}</div></div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-gray-700">Contact details unlock after an accepted booking.</p>
            </div>
          )}
        </section>

        {/* Services Detailed (selector – READ-ONLY details) */}
        <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-teal-800 mb-4">🧹 Services &amp; Duration</h2>

          {Array.isArray(cleaner.servicesDetailed) && cleaner.servicesDetailed.filter(s => s.active !== false).length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">Service</label>
                <select
                  className="modern-select w-full"
                  value={selectedServiceKey}
                  onChange={(e) => {
                    const nextKey = e.target.value;
                    setSelectedServiceKey(nextKey);
                    const svc = (cleaner.servicesDetailed || []).find(s => s.key === nextKey);
                    if (svc) {
                      // 🔒 Read-only: always lock to service defaults
                      setDurationMins(svc.defaultDurationMins ?? 60);
                      setBufferBeforeMins(svc.bufferBeforeMins ?? 0);
                      setBufferAfterMins(svc.bufferAfterMins ?? 0);
                    }
                  }}
                >
                  {(cleaner.servicesDetailed || [])
                    .filter((s) => s.active !== false)
                    .map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.name || s.key} ({s.defaultDurationMins ?? 60} mins)
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-600">
                  Increment: {service?.incrementMins ?? 60} mins • Allowed range: {minDuration}–{maxDuration} mins
                </p>
              </div>

              {/* Read-only info panel */}
              {service && (
                <div className="grid md:grid-cols-4 gap-3 bg-white/50 rounded-xl border border-white/30 p-3 text-sm">
                  <div>
                    <div className="text-gray-600">Duration</div>
                    <div className="font-semibold">{durationMins} mins</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Buffer Before</div>
                    <div className="font-semibold">{bufferBeforeMins} mins</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Buffer After</div>
                    <div className="font-semibold">{bufferAfterMins} mins</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Required Span</div>
                    <div className="font-semibold">{span} hour{span > 1 ? 's' : ''}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-700">This cleaner hasn’t listed detailed services yet.</p>
          )}
        </section>

        {/* Availability + Booking */}
        <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-teal-800 mb-4">📅 Availability</h2>

          <div className="overflow-x-auto border border-white/30 rounded-xl">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Day</th>
                  {HOURS.map((h) => (
                    <th key={`h-${h}`} className="p-2 text-center">{labelForHour(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => {
                  const row = cleaner.availability?.[day] || {};
                  return (
                    <tr key={day} className="border-t">
                      <td className="p-2 font-medium">{day}</td>
                      {HOURS.map((h) => {
                        const raw = row[String(h)];
                        const statusVal = typeof raw === 'object' ? raw?.status : raw;

                        // states
                        const isAvailable = statusVal === true || statusVal === 'available';
                        const isPending = statusVal === 'pending' || statusVal === 'pending_approval';
                        const isBooked = statusVal === 'booked' || statusVal === false || statusVal === 'unavailable';

                        // for selection: ensure span fits
                        const fits =
                          isAvailable &&
                          h + span <= 24 &&
                          hasContiguousAvailability(cleaner.availability || {}, day, h, span);

                        const isSelected = selectedDay === day && selectedHour === h;

                        const cls =
                          fits
                            ? isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                            : isPending
                            ? 'bg-yellow-100 text-yellow-800'
                            : isBooked
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-500';

                        return (
                          <td
                            key={`${day}-${h}`}
                            className={`p-1 text-center select-none ${cls}`}
                            onClick={() => (fits ? selectCell(day, h) : null)}
                            title={
                              fits
                                ? `Start at ${labelForHour(h)} (blocks ${span}h)`
                                : isPending
                                ? 'Pending request'
                                : isBooked
                                ? 'Unavailable'
                                : 'Not selectable'
                            }
                          >
                            {fits ? (isSelected ? '✓' : '•') : isPending ? '⏳' : '✗'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={createBooking}
              disabled={creating || !selectedDay || selectedHour == null || !service || !canSelectStart}
              className={`px-5 py-2 rounded-lg text-white font-semibold shadow ${creating || !canSelectStart ? 'bg-teal-300' : 'bg-teal-700 hover:bg-teal-800'}`}
            >
              {creating ? 'Sending…' : 'Request Booking'}
            </button>

            <span className="text-sm text-gray-600">
              {selectedDay && selectedHour != null
                ? `Selected: ${selectedDay} at ${labelForHour(selectedHour)} (${span}h block)`
                : 'Select a start time'}
            </span>
          </div>
        </section>

        {/* Bio */}
        {cleaner.bio && (
          <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-teal-800 mb-2">🧾 About</h2>
            <p className="text-gray-800 whitespace-pre-wrap">{cleaner.bio}</p>
          </section>
        )}

        {/* Gallery */}
        {Array.isArray(cleaner.photos) && cleaner.photos.length > 0 && (
          <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-teal-800 mb-4">🖼️ Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cleaner.photos.map((ph, i) => {
                const lock = !contactUnlocked && !!ph.hasText;
                return (
                  <div key={ph.public_id || ph.url || i} className="relative overflow-hidden rounded-xl border border-white/30">
                    <img
                      src={ph.url}
                      alt={`Photo ${i + 1}`}
                      className={`w-full h-40 object-cover transition ${lock ? 'blur-sm grayscale brightness-75' : ''}`}
                      loading="lazy"
                    />
                    {lock && (
                      <div className="absolute inset-0 grid place-items-center text-white text-sm bg-black/30">
                        🔒 Unlock to view
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Reviews */}
        {(cleaner.googleReviews?.url || cleaner.facebookReviewUrl || cleaner.embedCode) && (
          <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-teal-800 mb-4">⭐ Reviews</h2>

            <div className="flex flex-wrap gap-3">
              {cleaner.googleReviews?.url && (
                <a
                  href={cleaner.googleReviews.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Google Reviews
                </a>
              )}
              {cleaner.facebookReviewUrl && (
                <a
                  href={cleaner.facebookReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Facebook Page
                </a>
              )}
            </div>

            {cleaner.embedCode && isSafeEmbed(cleaner.embedCode) && (
              <div
                className="mt-4 bg-white/50 rounded-xl p-4 border border-white/30"
                dangerouslySetInnerHTML={{ __html: cleaner.embedCode }}
              />
            )}
          </section>
        )}
      </div>

      <style jsx global>{`
        .modern-input, .modern-select {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(13, 148, 136, 0.3);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }
        .modern-input:focus, .modern-select:focus {
          border-color: #0D9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
        }
      `}</style>
    </main>
  );
}
