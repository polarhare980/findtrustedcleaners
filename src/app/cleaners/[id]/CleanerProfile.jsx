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

// Robust ID for each service (handles data without .key)
function svcId(s) {
  return (s?.key ?? s?.id ?? s?.name ?? '').toString();
}

/* -------------------------- Date / Week utilities ------------------------- */

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function addWeeks(date, w) {
  return addDays(date, w * 7);
}
function fmtShort(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // e.g., 19 Aug
}
function fmtRangeLabel(monday) {
  const start = fmtShort(monday);
  const end = fmtShort(addDays(monday, 6));
  return `${start} – ${end}`;
}
function toISODate(d) {
  const z = new Date(d);
  z.setHours(0,0,0,0);
  return z.toISOString().slice(0,10); // YYYY-MM-DD
}
function getWeekISODates(mondayDate) {
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(mondayDate, i)));
}

/**
 * Compose a week view from:
 * - baseWeekly (Mon..Sun, hour->bool/'unavailable'/status objects)
 * - overridesByISO: { "YYYY-MM-DD": { "7": true|false|'unavailable', ... } }
 * Note: any existing "pending/booked" statuses already baked into baseWeekly will be preserved.
 */
function composeWeekView(baseWeekly = {}, overridesByISO = {}, mondayDate) {
  const weekISO = getWeekISODates(mondayDate);
  const out = {};

  DAYS.forEach((dayName, idx) => {
    const iso = weekISO[idx];
    const baseDay = baseWeekly?.[dayName] || {};
    const overrideDay = overridesByISO?.[iso] || {};
    out[dayName] = {};

    HOURS.forEach((h) => {
      const hour = String(h);

      // if base has an overlay object (e.g., {status:'pending'|'booked'}) keep that
      const baseVal = baseDay?.[hour];
      if (baseVal && typeof baseVal === 'object' && baseVal.status) {
        out[dayName][hour] = baseVal;
        return;
      }

      // start with base primitive value (true|false|'unavailable'|undefined)
      let val = baseVal;

      // apply override if present (only primitives stored as overrides)
      if (Object.prototype.hasOwnProperty.call(overrideDay, hour)) {
        val = overrideDay[hour];
      }

      out[dayName][hour] = val;
    });
  });

  return out;
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

  // week selector
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week
  const mondayThisWeek = useMemo(() => getMonday(new Date()), []);
  const mondaySelected = useMemo(() => addWeeks(mondayThisWeek, weekOffset), [mondayThisWeek, weekOffset]);

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

        // 2) purchases feed -> inject pending/accepted into base weekly grid
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
            const idForFirst = svcId(firstActive);
            setSelectedServiceKey(idForFirst);      // ✅ stable ID
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

  // ✅ Find service by robust ID (key || id || name)
  const service = useMemo(() => {
    if (!cleaner) return null;
    const list = cleaner.servicesDetailed || [];
    const found = list.find((s) => svcId(s) === selectedServiceKey);
    return found || null;
  }, [cleaner, selectedServiceKey]);

  // Description convenience
  const serviceDescription = useMemo(() => service?.description ?? service?.desc ?? '', [service]);

  // Keep increment/min/max for internal span calc (not shown to client)
  const increment = useMemo(() => service?.incrementMins ?? 60, [service]);
  const minDuration = useMemo(() => service?.minDurationMins ?? 60, [service]);
  const maxDuration = useMemo(() => service?.maxDurationMins ?? 240, [service]);

  // Span required for this booking config (buffers included but hidden in UI)
  const span = useMemo(
    () => requiredHourSpan({ durationMins, bufferBeforeMins, bufferAfterMins }),
    [durationMins, bufferBeforeMins, bufferAfterMins]
  );

  // Compose week: base weekly (possibly injected with pending/booked) + date overrides
  const weekAvailability = useMemo(() => {
    if (!cleaner) return {};
    return composeWeekView(
      cleaner.availability || {},
      cleaner.availabilityOverrides || {},
      mondaySelected
    );
  }, [cleaner, mondaySelected]);

  const canSelectStart = useMemo(() => {
    if (!selectedDay || selectedHour == null) return false;
    if (selectedHour + span > 24) return false;
    // Use the composed week's availability for span checks
    return hasContiguousAvailability(weekAvailability || {}, selectedDay, selectedHour, span);
  }, [weekAvailability, selectedDay, selectedHour, span]);

  // Limit weeks a client can browse by the cleaner's plan
  const maxAhead = cleaner?.isPremium ? 3 : 0; // Free = this week only; Premium = +3 => total 4
  const canGoPrev = weekOffset > 0;            // no past weeks
  const canGoNext = weekOffset < maxAhead;

  /* ---------------------------- Contact Unlock ---------------------------- */

  useEffect(() => {
    if (!cleaner?._id) return;

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

    // derive isoDate for the selected column (week + day)
    const isoDates = getWeekISODates(mondaySelected);
    const dayIdx = DAYS.indexOf(selectedDay);
    const isoDate = isoDates[dayIdx];

    setCreating(true);
    setToast('');
    try {
      const res = await fetch(CREATE_PURCHASE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cleanerId: cleaner._id,
          // legacy fields – keep for backward compatibility
          day: selectedDay,
          hour: selectedHour, // number
          // new date-specific field (safe to ignore server-side if not supported yet)
          isoDate,
          serviceKey: svcId(service), // use robust ID
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

      // Refresh purchases overlay (this affects current week's base overlay; acceptable)
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

        {/* Services (buttons) – READ-ONLY for clients */}
        <section className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-teal-800 mb-4">🧹 Services &amp; Duration</h2>

          {Array.isArray(cleaner.servicesDetailed) && cleaner.servicesDetailed.filter(s => s.active !== false).length > 0 ? (
            <div className="space-y-4">
              {/* Service buttons */}
              <div className="space-y-2">
                <div className="text-sm text-gray-700">Choose a service</div>
                <div className="flex flex-wrap gap-2">
                  {(cleaner.servicesDetailed || [])
                    .filter((s) => s.active !== false)
                    .map((s) => {
                      const idForSvc = svcId(s);
                      const isSelected = selectedServiceKey === idForSvc;
                      return (
                        <button
                          key={idForSvc || s.name}
                          type="button"
                          onClick={() => {
                            setSelectedServiceKey(idForSvc); // ✅ robust
                            // lock to cleaner-defined defaults
                            setDurationMins(s.defaultDurationMins ?? 60);
                            setBufferBeforeMins(s.bufferBeforeMins ?? 0);
                            setBufferAfterMins(s.bufferAfterMins ?? 0);
                          }}
                          className={[
                            "px-4 py-2 rounded-full border transition select-none",
                            isSelected
                              ? "bg-teal-700 text-white border-teal-700 shadow"
                              : "bg-white/80 text-teal-800 border-teal-300 hover:bg-teal-50"
                          ].join(" ")}
                          aria-pressed={isSelected}
                        >
                          {s.name || s.key || 'Service'}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Read-only details */}
              {service && (
                <div className="space-y-3">
                  {/* Description row (NEW) */}
                  {(serviceDescription?.trim?.() || '') && (
                    <div className="bg-white/50 rounded-xl border border-white/30 p-3 text-sm text-gray-800">
                      <div className="text-gray-600 mb-1">Description</div>
                      <div className="whitespace-pre-wrap">{serviceDescription}</div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-3 gap-3 bg-white/50 rounded-xl border border-white/30 p-3 text-sm">
                    <div>
                      <div className="text-gray-600">Selected</div>
                      <div className="font-semibold">{service.name || service.key}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Duration</div>
                      <div className="font-semibold">{durationMins} mins</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Required Span</div>
                      <div className="font-semibold">
                        {span} hour{span > 1 ? 's' : ''}
                      </div>
                    </div>
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
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-teal-800">📅 Availability</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                disabled={!canGoPrev}
                className={`px-3 py-2 rounded-lg border ${canGoPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                title="Previous week (disabled)"
              >
                ◀
              </button>
              <div className="px-3 py-2 rounded-lg bg-white/70 border font-medium">
                Week of {fmtRangeLabel(mondaySelected)}
                {!cleaner.isPremium && <span className="ml-2 text-xs text-amber-700">(Free cleaner: this week only)</span>}
              </div>
              <button
                onClick={() => setWeekOffset((w) => Math.min(maxAhead, w + 1))}
                disabled={!canGoNext}
                className={`px-3 py-2 rounded-lg border ${canGoNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                title={canGoNext ? 'Next week' : 'This cleaner only opens this week'}
              >
                ▶
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-white/30 rounded-xl">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">
                    Day
                    <div className="text-xs font-normal text-gray-500">Date</div>
                  </th>
                  {HOURS.map((h) => (
                    <th key={`h-${h}`} className="p-2 text-center">{labelForHour(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, idxDay) => {
                  const row = weekAvailability?.[day] || {};
                  const dateForDay = addDays(mondaySelected, idxDay);
                  return (
                    <tr key={day} className="border-t">
                      <td className="p-2 font-medium">
                        <div>{day}</div>
                        <div className="text-xs text-gray-500">{fmtShort(dateForDay)}</div>
                      </td>
                      {HOURS.map((h) => {
                        const raw = row[String(h)];
                        const statusVal = typeof raw === 'object' ? raw?.status : raw;

                        // states
                        const isAvailable = statusVal === true || statusVal === 'available';
                        const isPending = statusVal === 'pending' || statusVal === 'pending_approval';
                        const isBooked = statusVal === 'booked' || statusVal === false || statusVal === 'unavailable';

                        // for selection: ensure span fits in the *composed* week grid
                        const fits =
                          isAvailable &&
                          h + span <= 24 &&
                          hasContiguousAvailability(weekAvailability || {}, day, h, span);

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
            <h2 className="text-2xl font-bold text-teal-800 mb-4">🖼️ Gallery</h2>
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
