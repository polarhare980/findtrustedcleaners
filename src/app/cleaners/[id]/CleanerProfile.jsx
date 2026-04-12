// File: src/app/cleaners/[id]/CleanerProfile.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PurchaseButton from '@/components/PurchaseButton';
import RatingStars from '@/components/RatingStars';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PremiumBenefits from '@/components/PremiumBenefits';
import Link from 'next/link';

// Public APIs
const PUBLIC_CLEANER_API = (id) => `/api/public-cleaners/${id}`;
const PUBLIC_PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;
const FALLBACK_IMAGE = '/default-avatar.png';

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
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addWeeks(date, w) {
  return addDays(date, w * 7);
}
function toISODate(d) {
  const z = new Date(d);
  z.setHours(0, 0, 0, 0);
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
  const pendingKeyToId = new Map(); // `${isoDate}|${day}|${hour}` -> id
  const bookedKeys = new Set();     // `${isoDate}|${day}|${hour}`

  for (const row of purchases || []) {
    const day = row?.day;
    const start = Number(row?.hour);
    const span = Number(row?.span || 1);
    if (!day || !Number.isInteger(start)) continue;

    const status = String(row?.status || '').toLowerCase();
    const hours = Array.from({ length: Math.max(1, span) }, (_, i) => String(start + i));

    if (PENDING_STATUSES.has(status)) {
      const isoDate = String(row?.isoDate || '');
      for (const h of hours) pendingKeyToId.set(`${isoDate}|${day}|${h}`, String(row?._id || ''));
    } else if (BOOKED_STATUSES.has(status)) {
      const isoDate = String(row?.isoDate || '');
      for (const h of hours) bookedKeys.add(`${isoDate}|${day}|${h}`);
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
function getServiceSpan(service, chosenDurationMins) {
  if (!service) return 1;
  const duration = Number(chosenDurationMins || service.defaultDurationMins || 60);
  const before = Number(service.bufferBeforeMins || 0);
  const after = Number(service.bufferAfterMins || 0);
  return Math.max(1, Math.ceil((duration + before + after) / 60));
}

function canFitSpan(composedWeek, day, startHour, span) {
  for (let i = 0; i < span; i++) {
    const cell = composedWeek?.[day]?.[String(Number(startHour) + i)];
    if (cell !== true) return false;
  }
  return true;
}

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
      const overlayKey = `${iso}|${dayName}|${hour}`;
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

  const [cleaner, setCleaner] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [selected, setSelected] = useState({ day: null, hour: null });
  const [selectedISO, setSelectedISO] = useState(null);
  const [selectedServiceKey, setSelectedServiceKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState({ summary: null, data: [] });

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
        const [cRes, pRes, rRes] = await Promise.all([
          fetch(PUBLIC_CLEANER_API(id), { credentials: 'include' }),
          fetch(PUBLIC_PURCHASES_API(id), { credentials: 'include' }),
          fetch(`/api/public/cleaners/${id}/reviews`, { credentials: 'include' }),
        ]);
        const cJson = await cRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));
        const rJson = await rRes.json().catch(() => ({}));

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
        setReviewData({ summary: rJson?.summary || null, data: Array.isArray(rJson?.data) ? rJson.data : [] });
        setError('');
      } catch (e) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
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

  const normalizeServiceKey = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const activeServices = useMemo(
    () => (Array.isArray(cleaner?.servicesDetailed)
      ? cleaner.servicesDetailed
          .filter((s) => s?.name && s?.active !== false)
          .map((s) => ({ ...s, key: normalizeServiceKey(s?.key || s?.name) }))
      : []),
    [cleaner?.servicesDetailed]
  );

  const selectedService = useMemo(
    () => activeServices.find((svc) => normalizeServiceKey(svc.key) === normalizeServiceKey(selectedServiceKey)) || activeServices[0] || null,
    [activeServices, selectedServiceKey]
  );

  useEffect(() => {
    if (!activeServices.length) return;
    if (!selectedServiceKey || !activeServices.some((svc) => normalizeServiceKey(svc.key) === normalizeServiceKey(selectedServiceKey))) {
      setSelectedServiceKey(activeServices[0].key);
      return;
    }
  }, [activeServices, selectedServiceKey]);

  const selectedDurationMins = Number(selectedService?.defaultDurationMins || 60);
  const selectedSpan = useMemo(
    () => getServiceSpan(selectedService, selectedDurationMins),
    [selectedService, selectedDurationMins]
  );

  // ---- Google Reviews (dashboard fields first) ----
  const googleReviewRating = cleaner?.googleReviewRating ?? cleaner?.googleReviews?.rating ?? null;
  const googleReviewCount = cleaner?.googleReviewCount ?? cleaner?.googleReviews?.count ?? null;
  const siteReviewAverage = Number(reviewData?.summary?.average || cleaner?.rating || 0);
  const siteReviewCount = Number(reviewData?.summary?.count || cleaner?.ratingCount || 0);
  const siteBreakdown = reviewData?.summary?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const siteHighlights = reviewData?.summary?.highlights || {};
  const topReviewHighlights = Object.entries(siteHighlights)
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 4);
  const featuredReview = (reviewData?.data || []).find((item) => String(item?.text || '').trim()) || reviewData?.data?.[0] || null;
  const isTopRated = siteReviewCount >= 5 && siteReviewAverage >= 4.5;

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
    if (v === true || v === 'available') {
      return canFitSpan(composedWeek, day, Number(hour), selectedSpan) ? 'available' : 'unavailable';
    }
    return 'unavailable';
  }


  function onSelect(day, hour) {
    if (getCellState(day, hour) !== 'available') return;
    setSelected({ day, hour });
    const dayIdx = DAYS.indexOf(day);
    if (dayIdx >= 0) setSelectedISO(weekISO[dayIdx]);
    // scroll to the purchase panel
    const el = document.getElementById('purchase-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
        <PublicHeader />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="animate-pulse rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">Loading cleaner profile…</div>
        </div>
        <PublicFooter />
      </main>
    );
  }
  if (error || !cleaner) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
        <PublicHeader />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error || 'Cleaner not found'}</div>
        </div>
        <PublicFooter />
      </main>
    );
  }

  // Rate can be number or object (dashboard commonly stores a number)
  const hourlyRate =
    typeof cleaner.rates === 'number'
      ? cleaner.rates
      : (cleaner.rates && (cleaner.rates.hourly || cleaner.rates.regular)) || null;

  const coverPhoto =
    normalizedPhotos.find((p) => !p.hasText)?.url || cleaner?.image || normalizedPhotos[0]?.url || FALLBACK_IMAGE;

  // ----- Badges (match dashboard flags) -----
  const badges = [];
  if (cleaner.isPremium)
    badges.push({ key: 'premium', label: 'Premium', tone: 'from-amber-400 to-yellow-500' });
  if (isTopRated)
    badges.push({ key: 'top-rated', label: 'Top Rated', tone: 'from-amber-300 to-orange-500' });
  if (cleaner.businessInsurance)
    badges.push({ key: 'insured', label: 'Insured', tone: 'from-emerald-400 to-teal-500' });
  if (cleaner.dbsChecked)
    badges.push({ key: 'dbs', label: 'DBS Checked', tone: 'from-blue-400 to-indigo-500' });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <section className="mb-6 rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Cleaner profile</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{cleaner.companyName || cleaner.realName || 'Cleaner'}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">View trust signals, service pricing, recent reviews and live availability in one place before you book.</p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">Public profile with live availability and booking request flow.</div>
          </div>
        </section>

      {/* Header */}
      <header className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8 flex flex-col md:flex-row gap-6 items-start">
        {/* Hero */}
        <div className="w-full md:w-64 shrink-0">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow">
            <img
              src={coverPhoto}
              alt={cleaner.companyName || cleaner.realName || 'Cleaner'}
              className={`object-cover w-full h-full ${cleaner.imageHasText ? 'blur-sm' : ''}`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
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
                <span
                  key={b.key}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${b.tone} shadow`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Minimal, non-contact location only */}
          <p className="text-sm text-gray-600">{cleaner?.address?.postcode || ''}</p>

          <div className="mt-3 grid gap-2">
            {siteReviewCount > 0 && (
              <div className="flex items-center gap-3 flex-wrap text-sm text-slate-700">
                <RatingStars value={siteReviewAverage} count={siteReviewCount} size={16} />
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Verified platform reviews</span>
                {isTopRated ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Top Rated Cleaner</span>
                ) : null}
              </div>
            )}

            {(googleReviewRating != null || googleReviewCount != null) && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Google:</span>
                {googleReviewRating != null && (
                  <span className="font-semibold">
                    ⭐ {Number.isFinite(Number(googleReviewRating)) ? Number(googleReviewRating).toFixed(1) : googleReviewRating}
                  </span>
                )}
                {googleReviewCount != null && <span>({googleReviewCount} reviews)</span>}
              </div>
            )}
          </div>

          {hourlyRate && (
            <div className="text-slate-800 text-lg font-semibold mt-3">£{hourlyRate}/hour</div>
          )}

          {featuredReview ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest customer review</div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <RatingStars value={Number(featuredReview?.rating || 0)} count={0} size={14} />
                  <span className="text-xs font-semibold text-slate-500">{Number(featuredReview?.rating || 0).toFixed(1)}/5</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {featuredReview?.text ? `“${featuredReview.text}”` : 'This customer left a rating but no written review yet.'}
              </p>
              <div className="mt-2 text-xs text-slate-500">
                {featuredReview?.serviceName || 'Cleaning service'}
                {featuredReview?.createdAt ? ` • ${new Date(featuredReview.createdAt).toLocaleDateString('en-GB')}` : ''}
              </div>
            </div>
          ) : null}
        </div>

        {/* CTA (scrolls to availability; keeps contact gated) */}
        <div className="w-full md:w-60">
          <div className="rounded-2xl p-5 bg-white/70 border border-slate-100 shadow flex flex-col gap-3">
            <div className="text-sm text-slate-600">Interested?</div>
            <button
              onClick={() => {
                const el = document.getElementById('booking-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full rounded-xl py-2.5 font-semibold bg-teal-600 text-white hover:bg-teal-700 transition"
            >
              Check Availability
            </button>
            <div className="text-xs text-slate-500">
              Profiles are now fully visible. Clients can book through the platform or contact the cleaner directly.
            </div>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trust signals</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.length ? badges.map((b) => (
              <span key={`trust-${b.key}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {b.label}
              </span>
            )) : <span className="text-sm text-slate-500">Profile details are still being built out.</span>}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review snapshot</div>
          <div className="mt-3 text-3xl font-bold text-slate-900">{siteReviewCount > 0 ? siteReviewAverage.toFixed(1) : '—'}</div>
          <div className="mt-2 text-sm text-slate-600">{siteReviewCount > 0 ? `${siteReviewCount} verified platform review${siteReviewCount === 1 ? '' : 's'}` : 'No verified platform reviews yet.'}</div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Booking clarity</div>
          <div className="mt-3 text-sm leading-6 text-slate-600">Green slots are available, grey slots are already pending or booked, and red slots are unavailable.</div>
        </div>
      </section>

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
              <div
                key={p.public_id || `${p.url}-${i}`}
                className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow"
              >
                <img
                  src={p.url || FALLBACK_IMAGE}
                  alt={`Cleaner photo ${i + 1}`}
                  className={`w-full h-40 md:h-44 object-cover ${p.hasText ? 'blur-sm' : ''}`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
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


      {/* Contact details */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-teal-900 mb-3">Contact details</h2>
        <div className="rounded-2xl p-5 bg-white/70 border border-slate-100 shadow grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Phone</div>
            {cleaner.phone ? (
              <a href={`tel:${cleaner.phone}`} className="text-teal-700 font-semibold hover:underline">{cleaner.phone}</a>
            ) : (
              <div className="text-slate-500">Not provided</div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
            {cleaner.email ? (
              <a href={`mailto:${cleaner.email}`} className="text-teal-700 font-semibold hover:underline break-all">{cleaner.email}</a>
            ) : (
              <div className="text-slate-500">Not provided</div>
            )}
          </div>
          {cleaner?.googleReviews?.url ? (
            <div className="md:col-span-2">
              <Link href={cleaner.googleReviews.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-teal-700 font-medium hover:underline">
                View Google reviews
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Services */}
      {Array.isArray(cleaner.servicesDetailed) &&
        cleaner.servicesDetailed.filter((s) => s?.name && s?.active !== false).length > 0 ? (
          <section className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-bold text-teal-900">Services</h2>
              <span className="text-sm text-slate-500">Prices and durations set by the cleaner</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {cleaner.servicesDetailed
                .filter((svc) => svc?.name && svc?.active !== false)
                .map((svc, i) => (
                  <div key={`${svc.name}-${i}`} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{svc.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{svc.defaultDurationMins ?? 60} mins</p>
                      </div>
                      <div className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-800">
                        {svc.price != null ? `£${svc.price}` : 'Quote'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ) : Array.isArray(cleaner.services) && cleaner.services.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-teal-900 mb-3">Services</h2>
            <ul className="flex flex-wrap gap-2">
              {cleaner.services.map((s, i) => (
                <li
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-white/70 border border-slate-100 text-sm text-slate-700 shadow"
                >
                  {typeof s === 'string' ? s : s?.name || 'Service'}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
              className={`px-3 py-1 rounded border ${
                canGoPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Previous week (disabled)"
            >
              ◀
            </button>
            <div className="px-3 py-1 rounded bg-white/70 border text-sm">
              Week of {fmtRangeLabel(mondaySelected)}
              {!cleaner?.isPremium && (
                <span className="ml-2 text-xs text-amber-700">(Free: this week only)</span>
              )}
            </div>
            <button
              onClick={() => {
                if (!canGoNext) return;
                setSelected({ day: null, hour: null });
                setSelectedISO(null);
                setWeekOffset((w) => Math.min(maxAhead, w + 1));
              }}
              disabled={!canGoNext}
              className={`px-3 py-1 rounded border ${
                canGoNext ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={canGoNext ? 'Next week' : 'Upgrade to view more weeks'}
            >
              ▶
            </button>
          </div>
        </div>

        <div className="rounded-[28px] overflow-hidden border border-white/70 bg-white/88 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="overflow-x-auto touch-pan-x">
          <div className="min-w-[760px]">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${HOURS.length}, minmax(44px,1fr))` }}>
            {/* Header row */}
            <div className="p-2.5 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
              Day
            </div>
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

                  const base =
                    'h-9 md:h-10 border-t border-l last:border-r text-xs grid place-items-center select-none';
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
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
          <span className="mr-4 inline-flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-emerald-200" /> Available</span>
          <span className="mr-4 inline-flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-slate-300" /> Pending or booked</span>
          <span className="inline-flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-rose-200" /> Unavailable</span>
        </div>

        {/* Booking request panel */}
        <div id="purchase-panel" className="mt-5">
          <div className="rounded-2xl p-5 bg-white/70 border border-slate-100 shadow flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 text-sm text-slate-700">
                {selected.day && selected.hour != null && selectedISO ? (
                  <div>
                    <div className="font-semibold text-slate-900">Selected slot</div>
                    <div>
                      {selected.day} {hourLabel(selected.hour)} — {selectedISO}
                    </div>
                    {selectedService ? (
                      <div className="mt-1 text-slate-600">
                        {selectedService.name} • {selectedDurationMins} mins
                        {selectedSpan > 1 ? ` • blocks ${selectedSpan} hours on the calendar` : ''}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div>Select an available slot above to continue.</div>
                )}
              </div>

              {activeServices.length > 0 ? (
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Service</label>
                    <select
                      value={selectedServiceKey}
                      onChange={(e) => {
                        setSelectedServiceKey(e.target.value);
                        setSelected({ day: null, hour: null });
                        setSelectedISO(null);
                      }}
                      className="w-full rounded-xl border px-3 py-2 bg-white"
                    >
                      {activeServices.map((svc) => (
                        <option key={svc.key} value={svc.key}>{svc.name}</option>
                      ))}
                    </select>
                  </div>

                </div>
              ) : null}
            </div>

            <div className="w-full md:w-auto">
              <PurchaseButton
                cleanerId={String(id)}
                selectedSlot={{
                  day: selected.day,
                  hour: selected.hour,
                  date: selectedISO,
                  serviceKey: selectedService?.key,
                  serviceName: selectedService?.name,
                  durationMins: selectedDurationMins,
                  bufferBeforeMins: 0,
                  bufferAfterMins: 0,
                }}
                onPurchaseStart={() => {}}
                onPurchaseError={() => {}}
                onPurchaseSuccess={() => {}}
                disabled={!selected.day || selected.hour == null || !selectedISO}
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Choose a service and the saved service duration is used automatically for slot validation.
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Booking note */}
      <section className="mt-10">
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          You can contact this cleaner directly at any time. You can also send a booking request through the platform without creating an account. Your contact details will be passed to the cleaner.
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-teal-900 mb-3">Verified customer reviews</h2>
        <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          {siteReviewCount > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-5">
                <div className="text-3xl font-extrabold text-slate-900">{siteReviewAverage.toFixed(1)}</div>
                <div className="mt-2"><RatingStars value={siteReviewAverage} count={siteReviewCount} size={18} /></div>
                <div className="mt-4 space-y-2">
                  {[5,4,3,2,1].map((star) => {
                    const count = Number(siteBreakdown?.[star] || 0);
                    const width = siteReviewCount ? `${(count / siteReviewCount) * 100}%` : '0%';
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="w-8">{star}★</span>
                        <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-teal-500" style={{ width }} />
                        </div>
                        <span className="w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
                {topReviewHighlights.length > 0 ? (
                  <div className="mt-5">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Customers often mention</div>
                    <div className="flex flex-wrap gap-2">
                      {topReviewHighlights.map(([label, count]) => (
                        <span key={label} className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                          {label} · {count}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                {reviewData.data.slice(0, 6).map((review) => (
                  <article key={review._id} className="rounded-2xl border border-slate-100 bg-white/80 p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <RatingStars value={Number(review.rating || 0)} count={0} size={15} />
                          <span className="text-sm font-semibold text-slate-700">{Number(review.rating || 0).toFixed(1)}/5</span>
                          {review.verifiedBooking ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Verified booking</span>
                          ) : null}
                          {review.wouldBookAgain ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Would book again</span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {review.serviceName || 'Cleaning service'}
                          {review.createdAt ? ` • ${new Date(review.createdAt).toLocaleDateString('en-GB')}` : ''}
                        </div>
                      </div>
                    </div>
                    {Array.isArray(review.highlights) && review.highlights.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.highlights.map((item) => (
                          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{item}</span>
                        ))}
                      </div>
                    ) : null}
                    {review.text ? (
                      <p className="mt-3 text-slate-700 leading-7">“{review.text}”</p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No written comment left for this booking.</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">No verified platform reviews yet. The first completed booking review will appear here.</div>
          )}
        </div>
      </section>
      </div>

      <PremiumBenefits />
      <PublicFooter />
    </main>
  );
}
