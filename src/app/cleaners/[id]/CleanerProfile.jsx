// File: src/app/cleaners/[id]/CleanerProfile.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PurchaseButton from '@/components/PurchaseButton';
import RatingStars from '@/components/RatingStars';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PremiumBenefits from '@/components/PremiumBenefits';

const PUBLIC_CLEANER_API = (id) => `/api/public-cleaners/${id}`;
const PUBLIC_PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;
const FALLBACK_IMAGE = '/default-avatar.png';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i);
const BOOKED_STATUSES = new Set(['approved', 'accepted', 'confirmed', 'booked']);
const PENDING_STATUSES = new Set(['pending', 'pending_approval']);
const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
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
  return z.toISOString().slice(0, 10);
}
function getWeekISODates(mondayDate) {
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(mondayDate, i)));
}
function fmtShort(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function fmtRangeLabel(monday) {
  return `${fmtShort(monday)} – ${fmtShort(addDays(monday, 6))}`;
}
function formatSlotDate(isoDate, day, hour) {
  if (!isoDate) return `${day} ${hourLabel(hour)}`;
  const date = new Date(`${isoDate}T00:00:00`);
  const label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${label}, ${hourLabel(hour)}`;
}
function todayISO() {
  return toISODate(new Date());
}
function tomorrowISO() {
  return toISODate(addDays(new Date(), 1));
}
function normalizeServiceKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
function buildOverlayMaps(purchases = []) {
  const pendingKeyToId = new Map();
  const bookedKeys = new Set();

  for (const row of purchases || []) {
    const day = row?.day;
    const start = Number(row?.hour);
    const span = Number(row?.span || 1);
    if (!day || !Number.isInteger(start)) continue;

    const status = String(row?.status || '').toLowerCase();
    const hours = Array.from({ length: Math.max(1, span) }, (_, i) => String(start + i));
    const isoDate = String(row?.isoDate || '');

    if (PENDING_STATUSES.has(status)) {
      for (const h of hours) pendingKeyToId.set(`${isoDate}|${day}|${h}`, String(row?._id || ''));
    } else if (BOOKED_STATUSES.has(status)) {
      for (const h of hours) bookedKeys.add(`${isoDate}|${day}|${h}`);
    }
  }

  return { pendingKeyToId, bookedKeys };
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
      let val = baseDay?.[hour];
      if (Object.prototype.hasOwnProperty.call(overrideDay, hour)) val = overrideDay[hour];

      const overlayKey = `${iso}|${dayName}|${hour}`;
      if (overlays.bookedKeys.has(overlayKey)) out[dayName][hour] = { status: 'booked' };
      else if (overlays.pendingKeyToId.has(overlayKey)) out[dayName][hour] = { status: 'pending', bookingId: overlays.pendingKeyToId.get(overlayKey) };
      else out[dayName][hour] = val;
    });
  });

  return out;
}
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
    if (cell !== true && cell !== 'available') return false;
  }
  return true;
}
function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-full bg-slate-200/80 ${className}`} />;
}
function CleanerProfileSkeleton() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="animate-pulse aspect-[4/3] w-full rounded-[28px] bg-slate-200 md:w-72" />
              <div className="flex-1 space-y-4 pt-2">
                <SkeletonLine className="h-4 w-40" />
                <SkeletonLine className="h-9 w-4/5" />
                <SkeletonLine className="h-5 w-2/3" />
                <div className="flex flex-wrap gap-2">
                  <SkeletonLine className="h-8 w-24" />
                  <SkeletonLine className="h-8 w-28" />
                  <SkeletonLine className="h-8 w-20" />
                </div>
                <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <SkeletonLine className="h-4 w-36" />
                  <SkeletonLine className="mt-3 h-7 w-56" />
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <SkeletonLine className="h-5 w-44" />
              <SkeletonLine className="mt-5 h-12 w-full" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <SkeletonLine className="h-10 w-full" />
                <SkeletonLine className="h-10 w-full" />
                <SkeletonLine className="h-10 w-full" />
                <SkeletonLine className="h-10 w-full" />
              </div>
              <SkeletonLine className="mt-5 h-12 w-full" />
              <p className="mt-4 text-sm text-slate-500">Finding latest availability…</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonLine key={i} className="h-12 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}

export default function CleanerProfile() {
  const { id } = useParams();
  const bookingRef = useRef(null);

  const [cleaner, setCleaner] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [selected, setSelected] = useState({ day: null, hour: null });
  const [selectedISO, setSelectedISO] = useState(null);
  const [selectedServiceKey, setSelectedServiceKey] = useState('');
  const [slotFilter, setSlotFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState({ summary: null, data: [] });

  const mondayThisWeek = useMemo(() => getMonday(new Date()), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const mondaySelected = useMemo(() => addWeeks(mondayThisWeek, weekOffset), [mondayThisWeek, weekOffset]);
  const weekISO = useMemo(() => getWeekISODates(mondaySelected), [mondaySelected]);

  const maxAhead = cleaner?.isPremium ? 3 : 0;
  const canGoPrev = weekOffset > 0;
  const canGoNext = weekOffset < maxAhead;

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
        if (!cRes.ok || !cJson?.success || !cJson?.cleaner) throw new Error(cJson?.message || 'Cleaner not found');

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
    return () => { alive = false; };
  }, [id]);

  const normalizedPhotos = useMemo(() => {
    const arr = Array.isArray(cleaner?.photos) ? cleaner.photos : [];
    return arr.map((p) => {
      if (!p) return null;
      if (typeof p === 'string') return { url: p, public_id: '', hasText: false };
      return { url: p.url || p.secure_url || p.secureUrl || p.src || '', public_id: p.public_id || '', hasText: !!p.hasText };
    }).filter((p) => p?.url);
  }, [cleaner]);

  const activeServices = useMemo(() => {
    const detailed = Array.isArray(cleaner?.servicesDetailed)
      ? cleaner.servicesDetailed.filter((s) => s?.name && s?.active !== false).map((s) => ({ ...s, key: normalizeServiceKey(s?.key || s?.name) }))
      : [];
    if (detailed.length) return detailed;
    return (Array.isArray(cleaner?.services) ? cleaner.services : []).map((s) => {
      const name = typeof s === 'string' ? s : s?.name;
      return name ? { name, key: normalizeServiceKey(name), defaultDurationMins: 60 } : null;
    }).filter(Boolean);
  }, [cleaner?.servicesDetailed, cleaner?.services]);

  const selectedService = useMemo(
    () => activeServices.find((svc) => normalizeServiceKey(svc.key) === normalizeServiceKey(selectedServiceKey)) || activeServices[0] || null,
    [activeServices, selectedServiceKey]
  );

  useEffect(() => {
    if (!activeServices.length) return;
    if (!selectedServiceKey || !activeServices.some((svc) => normalizeServiceKey(svc.key) === normalizeServiceKey(selectedServiceKey))) {
      setSelectedServiceKey(activeServices[0].key);
    }
  }, [activeServices, selectedServiceKey]);

  const selectedDurationMins = Number(selectedService?.defaultDurationMins || 60);
  const selectedSpan = useMemo(() => getServiceSpan(selectedService, selectedDurationMins), [selectedService, selectedDurationMins]);

  const composedWeek = useMemo(() => composeWeekView(cleaner?.availability || {}, cleaner?.availabilityOverrides || {}, mondaySelected, purchases || []), [cleaner?.availability, cleaner?.availabilityOverrides, purchases, mondaySelected]);

  function getCellState(day, hour) {
    const vRaw = composedWeek?.[day]?.[String(hour)];
    const v = typeof vRaw === 'object' ? vRaw?.status : vRaw;
    if (v === 'pending' || v === 'pending_approval' || v === 'booked') return 'pending';
    if (v === true || v === 'available') return canFitSpan(composedWeek, day, Number(hour), selectedSpan) ? 'available' : 'unavailable';
    return 'unavailable';
  }

  const availableSlots = useMemo(() => {
    const slots = [];
    DAYS.forEach((day, dayIdx) => {
      HOURS.forEach((hour) => {
        const vRaw = composedWeek?.[day]?.[String(hour)];
        const v = typeof vRaw === 'object' ? vRaw?.status : vRaw;
        const state = (v === true || v === 'available') && canFitSpan(composedWeek, day, Number(hour), selectedSpan) ? 'available' : 'unavailable';
        if (state === 'available') slots.push({ day, dayShort: SHORT_DAYS[dayIdx], hour, iso: weekISO[dayIdx], label: formatSlotDate(weekISO[dayIdx], day, hour) });
      });
    });
    return slots.sort((a, b) => `${a.iso}-${a.hour}`.localeCompare(`${b.iso}-${b.hour}`));
  }, [composedWeek, selectedSpan, weekISO]);

  const filteredSlots = useMemo(() => {
    const t = todayISO();
    const tm = tomorrowISO();
    if (slotFilter === 'today') return availableSlots.filter((s) => s.iso === t);
    if (slotFilter === 'tomorrow') return availableSlots.filter((s) => s.iso === tm);
    if (slotFilter === 'weekend') return availableSlots.filter((s) => ['Saturday', 'Sunday'].includes(s.day));
    return availableSlots;
  }, [availableSlots, slotFilter]);

  const nextSlot = availableSlots[0] || null;
  const todaySlots = availableSlots.filter((s) => s.iso === todayISO());

  const siteReviewAverage = Number(reviewData?.summary?.average || cleaner?.rating || 0);
  const siteReviewCount = Number(reviewData?.summary?.count || cleaner?.ratingCount || 0);
  const googleReviewRating = cleaner?.googleReviewRating ?? cleaner?.googleReviews?.rating ?? null;
  const googleReviewCount = cleaner?.googleReviewCount ?? cleaner?.googleReviews?.count ?? null;
  const siteBreakdown = reviewData?.summary?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const siteHighlights = reviewData?.summary?.highlights || {};
  const topReviewHighlights = Object.entries(siteHighlights).filter(([, count]) => Number(count) > 0).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 4);
  const featuredReview = (reviewData?.data || []).find((item) => String(item?.text || '').trim()) || reviewData?.data?.[0] || null;
  const isTopRated = siteReviewCount >= 5 && siteReviewAverage >= 4.5;

  if (loading) return <CleanerProfileSkeleton />;

  if (error || !cleaner) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
        <PublicHeader />
        <div className="mx-auto max-w-4xl px-4 py-14">
          <div className="rounded-[30px] border border-rose-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">Profile unavailable</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">We couldn’t load this cleaner profile.</h1>
            <p className="mt-3 text-slate-600">{error || 'Cleaner not found'}</p>
            <Link href="/cleaners" className="mt-6 inline-flex rounded-full bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800">Back to available cleaners</Link>
          </div>
        </div>
        <PublicFooter />
      </main>
    );
  }

  const hourlyRate = typeof cleaner.rates === 'number' ? cleaner.rates : (cleaner.rates && (cleaner.rates.hourly || cleaner.rates.regular)) || null;
  const coverPhoto = normalizedPhotos.find((p) => !p.hasText)?.url || cleaner?.image || normalizedPhotos[0]?.url || FALLBACK_IMAGE;
  const companyName = cleaner.companyName || cleaner.realName || 'Cleaner';
  const mainService = selectedService?.name || cleaner.servicesDetailed?.find((s) => s?.active)?.name || cleaner.services?.[0] || 'Cleaning services';
  const locationLabel = cleaner.address?.town || cleaner.address?.county || cleaner.address?.postcode || 'your area';
  const selectedSlotLabel = selected.day && selected.hour != null && selectedISO ? formatSlotDate(selectedISO, selected.day, selected.hour) : '';

  const badges = [];
  if (cleaner.isPremium) badges.push({ key: 'premium', label: 'Premium cleaner', className: 'border-amber-200 bg-amber-50 text-amber-800' });
  if (cleaner.businessInsurance) badges.push({ key: 'insured', label: 'Insured', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' });
  if (cleaner.dbsChecked) badges.push({ key: 'dbs', label: 'DBS checked', className: 'border-blue-200 bg-blue-50 text-blue-800' });
  if (isTopRated) badges.push({ key: 'top-rated', label: 'Top rated', className: 'border-orange-200 bg-orange-50 text-orange-800' });

  const scrollToBooking = () => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const chooseSlot = (slot) => {
    setSelected({ day: slot.day, hour: slot.hour });
    setSelectedISO(slot.iso);
  };
  function onSelect(day, hour) {
    if (getCellState(day, hour) !== 'available') return;
    const dayIdx = DAYS.indexOf(day);
    setSelected({ day, hour });
    if (dayIdx >= 0) setSelectedISO(weekISO[dayIdx]);
    scrollToBooking();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#eef7f5_100%)] pb-24 text-slate-900 md:pb-0">
      <PublicHeader />

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <section className="overflow-hidden rounded-[34px] border border-white/70 bg-white/92 shadow-[0_26px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[1fr,390px]">
            <div className="p-5 md:p-8">
              <div className="grid gap-6 md:grid-cols-[290px,1fr]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[30px] bg-slate-100 shadow-lg">
                  <Image
                    src={coverPhoto}
                    alt={companyName}
                    fill
                    priority
                    sizes="(min-width: 768px) 290px, 100vw"
                    className={`object-cover ${cleaner.imageHasText ? 'blur-sm' : ''}`}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                  {cleaner.imageHasText ? <div className="absolute inset-0 grid place-items-center bg-white/65 text-xs font-semibold text-slate-700">Contact info hidden for safety</div> : null}
                  <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-800 shadow-sm">Live profile</div>
                  <button type="button" aria-label="Save cleaner" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-lg shadow-sm">♡</button>
                </div>

                <div className="flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">Cleaner profile</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{companyName}</h1>
                  <p className="mt-2 text-lg font-medium text-slate-700">{mainService} in {locationLabel}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {badges.length ? badges.map((badge) => (
                      <span key={badge.key} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${badge.className}`}>{badge.label}</span>
                    )) : <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">Profile details in progress</span>}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    {siteReviewCount > 0 ? <RatingStars value={siteReviewAverage} count={siteReviewCount} size={16} /> : <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">New on FindTrustedCleaners</span>}
                    {(googleReviewRating != null || googleReviewCount != null) ? (
                      <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Google {googleReviewRating != null ? Number(googleReviewRating).toFixed(1) : ''}{googleReviewCount != null ? ` · ${googleReviewCount} reviews` : ''}</span>
                    ) : null}
                  </div>

                  <div className="mt-5 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Live availability</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-2xl font-black text-slate-950">{todaySlots.length ? 'Available today' : nextSlot ? `Next available ${nextSlot.dayShort}` : 'No public slots showing'}</p>
                        <p className="mt-1 text-sm text-slate-600">{nextSlot ? `Next slot: ${nextSlot.label}` : 'You can still send an enquiry or view other cleaners.'}</p>
                      </div>
                      {hourlyRate ? <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm"><p className="text-xs text-slate-500">From</p><p className="text-xl font-black text-teal-800">£{hourlyRate}/hr</p></div> : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={scrollToBooking} className="rounded-full bg-teal-700 px-6 py-3 text-center font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800">Request booking</button>
                    <button type="button" onClick={scrollToBooking} className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800">View availability</button>
                  </div>
                </div>
              </div>
            </div>

            <aside ref={bookingRef} id="booking-section" className="border-t border-slate-100 bg-slate-50/70 p-5 lg:border-l lg:border-t-0 md:p-6">
              <div className="sticky top-4 rounded-[30px] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Request this cleaner</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">Book in 3 steps</h2>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">Live slots</span>
                </div>

                {activeServices.length > 0 ? (
                  <label className="mt-5 block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">1. Choose service</span>
                    <select
                      value={selectedServiceKey}
                      onChange={(e) => {
                        setSelectedServiceKey(e.target.value);
                        setSelected({ day: null, hour: null });
                        setSelectedISO(null);
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                    >
                      {activeServices.map((svc) => <option key={svc.key} value={svc.key}>{svc.name}{svc.price != null ? ` · £${svc.price}` : ''}</option>)}
                    </select>
                  </label>
                ) : null}

                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">2. Pick a time</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      ['today', 'Today'],
                      ['tomorrow', 'Tomorrow'],
                      ['week', 'This week'],
                      ['weekend', 'Weekend'],
                    ].map(([key, label]) => (
                      <button key={key} type="button" onClick={() => setSlotFilter(key)} className={`rounded-2xl border px-3 py-2 text-sm font-bold transition ${slotFilter === key ? 'border-teal-600 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200'}`}>{label}</button>
                    ))}
                  </div>

                  <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
                    {filteredSlots.length ? filteredSlots.slice(0, 12).map((slot) => {
                      const isChosen = selected.day === slot.day && Number(selected.hour) === Number(slot.hour) && selectedISO === slot.iso;
                      return (
                        <button key={`${slot.iso}-${slot.hour}`} type="button" onClick={() => chooseSlot(slot)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${isChosen ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'}`}>
                          <span className="font-bold text-slate-900">{slot.label}</span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isChosen ? 'bg-teal-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}>{isChosen ? 'Selected' : 'Available'}</span>
                        </button>
                      );
                    }) : (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                        No public slots showing for this filter. Try this week, or send an enquiry anyway.
                      </div>
                    )}
                  </div>
                </div>

                <div id="purchase-panel" className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">3. Send request</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedSlotLabel ? `Selected: ${selectedSlotLabel}` : 'Choose an available slot to continue.'}
                  </p>
                  {selectedService ? <p className="mt-1 text-xs text-slate-600">{selectedService.name} · {selectedDurationMins} mins{selectedSpan > 1 ? ` · blocks ${selectedSpan} hours` : ''}</p> : null}
                  <div className="mt-4 [&>button]:w-full [&>button]:justify-center [&>button]:rounded-2xl [&>button]:py-3 [&>button]:text-sm [&>button]:font-black">
                    <PurchaseButton
                      cleanerId={String(id)}
                      selectedSlot={{
                        day: selected.day,
                        hour: selected.hour,
                        date: selectedISO,
                        serviceKey: selectedService?.key,
                        serviceName: selectedService?.name,
                        durationMins: selectedDurationMins,
                        bufferBeforeMins: Number(selectedService?.bufferBeforeMins || 0),
                        bufferAfterMins: Number(selectedService?.bufferAfterMins || 0),
                      }}
                      onPurchaseStart={() => {}}
                      onPurchaseError={() => {}}
                      onPurchaseSuccess={() => {}}
                      disabled={!selected.day || selected.hour == null || !selectedISO}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-600">Today’s spaces can change quickly. Your request is sent to the cleaner with the selected service and time.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Trust signals</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.length ? badges.map((b) => <span key={`trust-${b.key}`} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${b.className}`}>{b.label}</span>) : <span className="text-sm text-slate-500">Profile details are still being built out.</span>}
            </div>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Review snapshot</p>
            <div className="mt-3 text-3xl font-black text-slate-900">{siteReviewCount > 0 ? siteReviewAverage.toFixed(1) : '—'}</div>
            <p className="mt-2 text-sm text-slate-600">{siteReviewCount > 0 ? `${siteReviewCount} verified platform review${siteReviewCount === 1 ? '' : 's'}` : 'No verified platform reviews yet.'}</p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Booking clarity</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Green slots are available, grey slots are pending or booked, and red slots are unavailable.</p>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Live availability</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Choose a slot</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => canGoPrev && setWeekOffset((v) => Math.max(0, v - 1))} disabled={!canGoPrev} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <span className="text-sm font-semibold text-slate-600">{fmtRangeLabel(mondaySelected)}</span>
              <button onClick={() => canGoNext && setWeekOffset((v) => Math.min(maxAhead, v + 1))} disabled={!canGoNext} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[86px_repeat(7,minmax(74px,1fr))] overflow-x-auto text-sm">
              <div className="border-b border-slate-200 bg-slate-50 p-3 font-bold text-slate-600">Time</div>
              {DAYS.map((day, idx) => <div key={day} className="border-b border-l border-slate-200 bg-slate-50 p-3 text-center font-bold text-slate-700"><span className="hidden sm:inline">{day}</span><span className="sm:hidden">{SHORT_DAYS[idx]}</span></div>)}
              {HOURS.map((h) => (
                <React.Fragment key={h}>
                  <div className="border-b border-slate-200 bg-slate-50 p-3 font-bold text-slate-600">{hourLabel(h)}</div>
                  {DAYS.map((day) => {
                    const state = getCellState(day, h);
                    const isSelected = selected.day === day && Number(selected.hour) === Number(h) && selectedISO === weekISO[DAYS.indexOf(day)];
                    const cls = state === 'pending'
                      ? 'bg-slate-200 text-slate-500'
                      : state === 'available'
                        ? 'bg-emerald-100/80 text-emerald-900 hover:bg-emerald-200/80'
                        : 'bg-rose-50 text-rose-500';
                    return (
                      <button key={`${day}-${h}`} onClick={() => onSelect(day, h)} disabled={state !== 'available'} className={`min-h-11 border-b border-l border-slate-200 text-xs font-bold transition ${cls} ${isSelected ? 'ring-2 ring-inset ring-teal-600' : ''}`} aria-pressed={isSelected} aria-label={`${day} ${hourLabel(h)}`}>{state === 'available' ? 'Free' : state === 'pending' ? 'Busy' : '—'}</button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {activeServices.length > 0 ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-slate-950">Services offered</h2>
              <span className="text-sm text-slate-500">Prices and durations set by the cleaner</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeServices.map((svc, i) => (
                <button key={`${svc.name}-${i}`} type="button" onClick={() => { setSelectedServiceKey(svc.key); scrollToBooking(); }} className="rounded-[24px] border border-slate-200 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-950">{svc.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{svc.defaultDurationMins ?? 60} mins</p>
                    </div>
                    <div className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-black text-teal-800">{svc.price != null ? `£${svc.price}` : 'Quote'}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {cleaner.isPremium && normalizedPhotos.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-black text-slate-950">Gallery</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {normalizedPhotos.map((p, i) => (
                <div key={p.public_id || `${p.url}-${i}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm">
                  <Image src={p.url || FALLBACK_IMAGE} alt={`Cleaner photo ${i + 1}`} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className={`object-cover ${p.hasText ? 'blur-sm' : ''}`} loading="lazy" />
                  {p.hasText ? <div className="absolute inset-0 grid place-items-center bg-white/60 text-xs font-bold text-slate-700">Contact info hidden for safety</div> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-3 text-2xl font-black text-slate-950">Reviews from local households</h2>
          <div className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] md:p-6">
            {siteReviewCount > 0 ? (
              <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                  <div className="text-4xl font-black text-slate-950">{siteReviewAverage.toFixed(1)}</div>
                  <div className="mt-2"><RatingStars value={siteReviewAverage} count={siteReviewCount} size={18} /></div>
                  <div className="mt-4 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = Number(siteBreakdown?.[star] || 0);
                      const width = siteReviewCount ? `${(count / siteReviewCount) * 100}%` : '0%';
                      return <div key={star} className="flex items-center gap-2 text-sm text-slate-600"><span className="w-8">{star}★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width }} /></div><span className="w-6 text-right">{count}</span></div>;
                    })}
                  </div>
                  {topReviewHighlights.length > 0 ? <div className="mt-5 flex flex-wrap gap-2">{topReviewHighlights.map(([label, count]) => <span key={label} className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">{label} · {count}</span>)}</div> : null}
                </div>
                <div className="space-y-4">
                  {reviewData.data.slice(0, 6).map((review) => <article key={review._id} className="rounded-2xl border border-slate-100 bg-white p-5"><div className="flex items-center gap-2 flex-wrap"><RatingStars value={Number(review.rating || 0)} count={0} size={15} /><span className="text-sm font-bold text-slate-700">{Number(review.rating || 0).toFixed(1)}/5</span>{review.verifiedBooking ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Verified booking</span> : null}</div><div className="mt-1 text-xs text-slate-500">{review.serviceName || 'Cleaning service'}{review.createdAt ? ` • ${new Date(review.createdAt).toLocaleDateString('en-GB')}` : ''}</div>{review.text ? <p className="mt-3 leading-7 text-slate-700">“{review.text}”</p> : <p className="mt-3 text-sm text-slate-500">No written comment left for this booking.</p>}</article>)}
                </div>
              </div>
            ) : featuredReview ? (
              <div className="text-sm text-slate-600">The first completed booking review will appear here.</div>
            ) : <div className="text-sm text-slate-600">No verified platform reviews yet. The first completed booking review will appear here.</div>}
          </div>
        </section>

        {cleaner.bio ? (
          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-black text-slate-950">About {companyName}</h2>
            <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm"><p className="whitespace-pre-line leading-7 text-slate-700">{cleaner.bio}</p></div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          FindTrustedCleaners helps you compare cleaner profiles, availability and reviews. Cleaner work, conduct, pricing and arrangements are handled directly by the cleaner and customer.
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/95 p-3 shadow-[0_-14px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{todaySlots.length ? 'Available today' : 'Next slot'}</p>
            <p className="text-sm font-black text-slate-950">{nextSlot ? nextSlot.label : 'Send enquiry'}</p>
          </div>
          <button type="button" onClick={scrollToBooking} className="rounded-full bg-teal-700 px-5 py-3 text-sm font-black text-white shadow-lg">Request booking</button>
        </div>
      </div>

      <PremiumBenefits />
      <PublicFooter />
    </main>
  );
}
