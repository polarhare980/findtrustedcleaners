// File: src/app/cleaners/[id]/CleanerProfile.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Public APIs
const PUBLIC_CLEANER_API = (id) => `/api/public-cleaners/${id}`;
const PUBLIC_PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;

// ---- Constants (match Dashboard) ----
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7..19
const BOOKED_STATUSES = new Set(['approved', 'accepted', 'confirmed', 'booked']);
const PENDING_STATUSES = new Set(['pending', 'pending_approval']);
const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

// ---- Date helpers (match Dashboard) ----
function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  d.setHours(0,0,0,0);
  return d;
}
function addWeeks(date, w) { return addDays(date, w * 7); }
function toISODate(d) {
  const z = new Date(d);
  z.setHours(0,0,0,0);
  return z.toISOString().slice(0, 10); // YYYY-MM-DD
}
function getWeekISODates(mondayDate) {
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(mondayDate, i)));
}
function fmtShort(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // e.g., 19 Aug
}
function fmtRangeLabel(monday) {
  const start = fmtShort(monday);
  const end = fmtShort(addDays(monday, 6));
  return `${start} – ${end}`;
}

// ---- Overlay builders (SPAN-AWARE like Dashboard) ----
function buildOverlayMaps(purchases = []) {
  const pendingKeyToId = new Map(); // `${day}|${hour}` -> id
  const bookedKeys = new Set();     // `${day}|${hour}`

  for (const row of purchases || []) {
    const day = row?.day;
    const start = Number(row?.hour);
    const span = Number(row?.span || 1);
    if (!day || !Number.isInteger(start)) continue;

    const status = String(row?.status || '').toLowerCase();
    const hours = Array.from({ length: Math.max(1, span) }, (_, i) => String(start + i));

    if (PENDING_STATUSES.has(status)) {
      for (const h of hours) pendingKeyToId.set(`${day}|${h}`, String(row?._id || ''));
    } else if (BOOKED_STATUSES.has(status)) {
      for (const h of hours) bookedKeys.add(`${day}|${h}`);
    }
  }

  return { pendingKeyToId, bookedKeys };
}

/**
 * Compose a given week's view:
 * 1) Start from base weekly pattern: cleaner.availability[day][hour] => true | false | 'unavailable'
 * 2) Apply date-specific overrides: cleaner.availabilityOverrides[YYYY-MM-DD][hour]
 * 3) Overlay purchases: booked > pending > base/override
 *
 * Returns: map { [dayName]: { [hourStr]: true|false|'unavailable'|{status} } }
 */
function composeWeekView(baseWeekly = {}, overridesByISO = {}, mondayDate, purchases = []) {
  const overlays = buildOverlayMaps(purchases);
  const weekISO = getWeekISODates(mondayDate);
  const out = {};

  DAYS.forEach((dayName, idx) => {
    const iso = weekISO[idx];
    const baseDay = baseWeekly?.[dayName] || {};
    const overrideDay = overridesByISO?.[iso] || {};
    out[dayName] = {};

    HOURS.forEach((h) => {
      const hour = String(h);
      // base
      let val = baseDay?.[hour];
      // override
      if (Object.prototype.hasOwnProperty.call(overrideDay, hour)) {
        val = overrideDay[hour];
      }
      // overlay precedence
      const overlayKey = `${dayName}|${hour}`;
      if (overlays.bookedKeys.has(overlayKey)) {
        out[dayName][hour] = { status: 'booked' };
      } else if (overlays.pendingKeyToId.has(overlayKey)) {
        out[dayName][hour] = { status: 'pending', bookingId: overlays.pendingKeyToId.get(overlayKey) };
      } else {
        out[dayName][hour] = val; // true | false | 'unavailable' | undefined
      }
    });
  });

  return out;
}

export default function CleanerProfile() {
  const { id } = useParams();
  const router = useRouter();

  const [cleaner, setCleaner] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [selected, setSelected] = useState({ day: null, hour: null });
  const [selectedISO, setSelectedISO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Week selector (public view: future only; premium up to 4 weeks total)
  const [weekOffset, setWeekOffset] = useState(0); // 0=this week
  const mondayThisWeek = useMemo(() => getMonday(new Date()), []);
  const mondaySelected = useMemo(() => addWeeks(mondayThisWeek, weekOffset), [mondayThisWeek, weekOffset]);
  const weekISO = useMemo(() => getWeekISODates(mondaySelected), [mondaySelected]);

  const canGoPrev = weekOffset > 0; // lock to current+future; disable past
  const maxAhead = cleaner?.isPremium ? 3 : 0; // premium = this week + 3 more
  const canGoNext = weekOffset < maxAhead;

  // Load public cleaner + purchases
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
          fetch(PUBLIC_CLEANER_API(id), { credentials: 'include' }),
          fetch(PUBLIC_PURCHASES_API(id), { credentials: 'include' }),
        ]);
        const cJson = await cRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));

        if (!alive) return;

        if (!cRes.ok || !cJson?.success || !cJson?.cleaner) {
          throw new Error(cJson?.message || 'Cleaner not found');
        }

        setCleaner({
          ...cJson.cleaner,
          businessInsurance: !!cJson.cleaner.businessInsurance,
          dbsChecked: !!cJson.cleaner.dbsChecked,
          isPremium: !!cJson.cleaner.isPremium,
        });

        setPurchases(Array.isArray(pJson?.purchases) ? pJson.purchases : []);
        setError('');
      } catch (e) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [id]);

  // ---- Normalised photos (respect hasText blur) ----
  const normalizedPhotos = useMemo(() => {
    const arr = Array.isArray(cleaner?.photos) ? cleaner.photos : [];
    return arr
      .map((p) => {
        if (!p) return null;
        if (typeof p === 'string') return { url: p, public_id: '', hasText: false };
        return {
          url: p.url || p.secure_url || p.secureUrl || p.src || '',
          public_id: p.public_id || '',
          hasText: !!p.hasText,
        };
      })
      .filter(Boolean);
  }, [cleaner]);

  // ---- Google Reviews (dashboard fields first) ----
  const googleReviewRating = cleaner?.googleReviewRating ?? cleaner?.googleReviews?.rating ?? null;
  const googleReviewCount  = cleaner?.googleReviewCount  ?? cleaner?.googleReviews?.count  ?? null;

  // ---- Availability for the selected week (matches Dashboard precedence) ----
  const composedWeek = useMemo(() => {
    return composeWeekView(
      cleaner?.availability || {},
      cleaner?.availabilityOverrides || {},
      mondaySelected,
      purchases || []
    );
  }, [cleaner?.availability, cleaner?.availabilityOverrides, purchases, mondaySelected]);

  function getCellState(day, hour) {
    const vRaw = composedWeek?.[day]?.[String(hour)];
    const v = typeof vRaw === 'object' ? vRaw?.status : vRaw;

    if (v === 'pending' || v === 'pending_approval' || v === 'booked') return 'pending';
    if (v === true || v === 'available') return 'available';
    return 'unavailable';
  }

  function onSelect(day, hour) {
    if (getCellState(day, hour) !== 'available') return;
    setSelected({ day, hour });
    const dayIdx = DAYS.indexOf(day);
    if (dayIdx >= 0) setSelectedISO(weekISO[dayIdx]);
  }

  function gotoBooking() {
    if (!selected.day || selected.hour == null) {
      alert('Please select a day and hour');
      return;
    }
    // include exact ISO date so checkout knows which week/day was chosen
    const q = new URLSearchParams({
      day: selected.day,
      hour: String(selected.hour),
      date: selectedISO || '', // YYYY-MM-DD
    }).toString();
    router.push(`/cleaners/${encodeURIComponent(String(id))}/checkout?${q}`);
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse rounded-2xl p-8 bg-white/50 backdrop-blur shadow">Loading…</div>
      </main>
    );
  }
  if (error || !cleaner) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="rounded-2xl p-6 bg-rose-50 text-rose-700 border border-rose-200">
          {error || 'Cleaner not found'}
        </div>
      </main>
    );
  }

  // Rate can be number or object (dashboard commonly stores a number)
  const hourlyRate = typeof cleaner.rates === 'number'
    ? cleaner.rates
    : (cleaner.rates && (cleaner.rates.hourly || cleaner.rates.regular)) || null;

  const coverPhoto =
    normalizedPhotos.find((p) => !p.hasText)?.url ||
    (normalizedPhotos[0]?.url || null);

  // ----- Badges (match dashboard flags) -----
  const badges = [];
  if (cleaner.isPremium) badges.push({ key: 'premium', label: 'Premium', tone: 'from-amber-400 to-yellow-500' });
  if (cleaner.businessInsurance) badges.push({ key: 'insured', label: 'Insured', tone: 'from-emerald-400 to-teal-500' });
  if (cleaner.dbsChecked) badges.push({ key: 'dbs', label: 'DBS Checked', tone: 'from-blue-400 to-indigo-500' });

  return (
    <main className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <header className="rounded-2xl bg-white/60 backdrop-blur shadow p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
        {/* Hero */}
        <div className="w-full md:w-64 shrink-0">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow">
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt={cleaner.companyName || cleaner.realName || 'Cleaner'}
                className={`object-cover w-full h-full ${cleaner.imageHasText ? 'blur-sm' : ''}`}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-slate-400">No photo</div>
            )}
            {cleaner.imageHasText && (
              <div className="absolute inset-0 grid place-items-center text-xs font-semibold text-slate-700 bg-white/60">
                Contact info hidden for safety
              </div>
            )}
          </div>
        </div>

        {/* Title & meta */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-teal-800">
              {cleaner.companyName || cleaner.realName || 'Cleaner'}
            </h1>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b.key} className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${b.tone} shadow`}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Minimal, non-contact location only */}
          <p className="text-sm text-gray-600">{cleaner?.address?.postcode || ''}</p>

          {/* Google reviews: rating & count only (URL hidden) */}
          {(googleReviewRating != null || googleReviewCount != null) && (
            <div className="flex items-center gap-3 text-sm text-slate-700 mt-2">
              {googleReviewRating != null && (
                <span className="font-semibold">
                  ⭐ {Number.isFinite(Number(googleReviewRating))
                    ? Number(googleReviewRating).toFixed(1)
                    : googleReviewRating}
                </span>
              )}
              {googleReviewCount != null && <span>({googleReviewCount} reviews)</span>}
            </div>
          )}

          {hourlyRate && <div className="text-slate-800 text-lg font-semibold mt-3">£{hourlyRate}/hour</div>}
        </div>

        {/* CTA (keeps contact gated) */}
        <div className="w-full md:w-60">
          <div className="rounded-2xl p-5 bg-white/70 border border-slate-100 shadow flex flex-col gap-3">
            <div className="text-sm text-slate-600">Interested?</div>
            <button
              onClick={gotoBooking}
              className="w-full rounded-xl py-2.5 font-semibold bg-teal-600 text-white hover:bg-teal-700 transition"
            >
              Request a Booking
            </button>
            <div className="text-xs text-slate-500">
              Contact details are shared <span className="font-semibold">after</span> a booking request is placed and approved.
            </div>
          </div>
        </div>
      </header>

      {/* Public Bio */}
      {cleaner.bio && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-teal-900 mb-2">Public Bio</h2>
          <div className="rounded-2xl p-5 bg-white/70 border border-slate-100 shadow">
            <p className="text-slate-700 leading-7 whitespace-pre-line">{cleaner.bio}</p>
          </div>
        </section>
      )}

      {/* Gallery (Premium only) */}
      {cleaner.isPremium && normalizedPhotos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-teal-900 mb-3">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {normalizedPhotos.map((p, i) => (
              <div key={p.public_id || `${p.url}-${i}`} className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow">
                <img
                  src={p.url}
                  alt={`Cleaner photo ${i + 1}`}
                  className={`w-full h-40 md:h-44 object-cover ${p.hasText ? 'blur-sm' : ''}`}
                  loading="lazy"
                />
                {p.hasText && (
                  <div className="absolute inset-0 grid place-items-center text-xs font-semibold text-slate-700 bg-white/60">
                    Contact info hidden for safety
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {Array.isArray(cleaner.services) && cleaner.services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-teal-900 mb-3">Services</h2>
          <ul className="flex flex-wrap gap-2">
            {cleaner.services.map((s, i) => (
              <li key={i} className="px-3 py-1.5 rounded-full bg-white/70 border border-slate-100 text-sm text-slate-700 shadow">
                {typeof s === 'string' ? s : s?.name || 'Service'}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Service Durations */}
      {Array.isArray(cleaner.servicesDetailed) && cleaner.servicesDetailed.filter(s => s?.name && (s?.active !== false)).length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-bold text-teal-900 mb-3">Service Durations</h2>
          <ul className="list-disc list-inside text-slate-700">
            {cleaner.servicesDetailed
              .filter((svc) => svc?.name && (svc?.active !== false))
              .map((svc, i) => (
                <li key={`${svc.name}-${i}`}>
                  {svc.name} ({svc.defaultDurationMins ?? 60} mins)
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Availability (week navigation like dashboard) */}
      <section id="booking-section" className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-teal-900">Availability</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!canGoPrev) return;
                setSelected({ day: null, hour: null });
                setSelectedISO(null);
                setWeekOffset((w) => Math.max(0, w - 1));
              }}
              disabled={!canGoPrev}
              className={`px-3 py-1 rounded border ${canGoPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              title="Previous week (disabled)"
            >
              ◀
            </button>
            <div className="px-3 py-1 rounded bg-white/70 border text-sm">
              Week of {fmtRangeLabel(mondaySelected)}
              {!cleaner?.isPremium && <span className="ml-2 text-xs text-amber-700">(Free: this week only)</span>}
            </div>
            <button
              onClick={() => {
                if (!canGoNext) return;
                setSelected({ day: null, hour: null });
                setSelectedISO(null);
                setWeekOffset((w) => Math.min(maxAhead, w + 1));
              }}
              disabled={!canGoNext}
              className={`px-3 py-1 rounded border ${canGoNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              title={canGoNext ? 'Next week' : 'Upgrade to view more weeks'}
            >
              ▶
            </button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white/60 shadow">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${HOURS.length}, minmax(44px,1fr))` }}>
            {/* Header row */}
            <div className="p-2.5 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">Day</div>
            {HOURS.map((h) => (
              <div key={`h-${h}`} className="p-2.5 bg-slate-50 text-slate-500 text-xs text-center">
                {hourLabel(h)}
              </div>
            ))}

            {/* Rows */}
            {DAYS.map((day, idx) => (
              <React.Fragment key={day}>
                <div className="p-2.5 text-slate-700 text-sm font-semibold bg-white/80 sticky left-0">
                  <div>{day}</div>
                  <div className="text-[11px] text-slate-500">{fmtShort(addDays(mondaySelected, idx))}</div>
                </div>
                {HOURS.map((h) => {
                  const state = getCellState(day, h);
                  const isSelected = selected.day === day && selected.hour === h && selectedISO === weekISO[idx];

                  const base = 'h-9 md:h-10 border-t border-l last:border-r text-xs grid place-items-center select-none';
                  const cls =
                    state === 'pending'
                      ? `${base} bg-slate-200 text-slate-500`
                      : state === 'available'
                        ? `${base} bg-emerald-100/70 hover:bg-emerald-200/70 cursor-pointer`
                        : `${base} bg-rose-100/60 text-rose-600`;

                  return (
                    <button
                      key={`${day}-${h}`}
                      className={`${cls} ${isSelected ? 'ring-2 ring-teal-500' : ''}`}
                      onClick={() => onSelect(day, h)}
                      disabled={state !== 'available'}
                      aria-pressed={isSelected}
                      aria-label={`${day} ${hourLabel(h)}`}
                    >
                      {hourLabel(h)}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Booking CTA */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch gap-3">
          <button
            onClick={gotoBooking}
            className="px-5 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition shadow"
          >
            Continue to Booking
          </button>
          <div className="text-xs text-slate-500 self-center">
            You’ll confirm details and share contact info after submitting a booking request.
          </div>
        </div>
      </section>

      {/* Safety note (no direct contact) */}
      <section className="mt-10">
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          For safety and fairness, cleaner phone and email are hidden until a booking is requested and approved.
        </div>
      </section>
    </main>
  );
}
