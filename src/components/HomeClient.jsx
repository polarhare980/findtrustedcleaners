'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { injectPendingFromPurchases } from '@/lib/availability';
import CleanerCard from './CleanerCard';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import PageHero from './PageHero';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json());
const CLEANERS_API = '/api/public-cleaners';
const PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i));
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

function toISODate(d) {
  const z = new Date(d);
  z.setHours(0, 0, 0, 0);
  return z.toISOString().slice(0, 10);
}

function composeCurrentWeekAvailability(baseWeekly = {}, overridesByISO = {}) {
  const monday = getMonday(new Date());
  const out = {};

  DAYS.forEach((dayName, idx) => {
    const iso = toISODate(addDays(monday, idx));
    const baseDay = baseWeekly?.[dayName] || {};
    const overrideDay = overridesByISO?.[iso] || {};
    out[dayName] = {};

    HOURS.forEach((hour) => {
      if (Object.prototype.hasOwnProperty.call(overrideDay, hour)) out[dayName][hour] = overrideDay[hour];
      else out[dayName][hour] = baseDay?.[hour];
    });
  });

  return out;
}

async function hydrateCleanersWithPurchases(cleaners) {
  return Promise.all(
    (cleaners || []).map(async (c) => {
      try {
        const res = await fetch(PURCHASES_API(c._id), { credentials: 'include' });
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        const payload = isJson ? await res.json() : { success: false, purchases: [] };
        const purchases = payload?.success ? payload.purchases : [];
        const merged = injectPendingFromPurchases?.(
          composeCurrentWeekAvailability(c.availability || {}, c.availabilityOverrides || {}),
          purchases,
        ) ?? composeCurrentWeekAvailability(c.availability || {}, c.availabilityOverrides || {});
        return { ...c, availabilityMerged: merged };
      } catch {
        return { ...c, availabilityMerged: c.availability || {} };
      }
    })
  );
}

function LoadingRow({ text }) {
  return <p className="py-10 text-center text-sm text-slate-500">{text}</p>;
}

function Step({ number, title, text }) {
  return (
    <div className="surface-card p-6 text-left">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-lg font-semibold text-white">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const { data, isLoading } = useSWR(CLEANERS_API, fetcher);

  const [postcode, setPostcode] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [premiumCleaners, setPremiumCleaners] = useState([]);
  const [freeCleaners, setFreeCleaners] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('favourites');
      if (saved) {
        const arr = JSON.parse(saved);
        setFavouriteIds(Array.isArray(arr) ? arr.map(String) : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (live && res.ok && json?.success) setViewer(json.user || null);
      } catch {}
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!data?.success || !Array.isArray(data.cleaners)) return;
    const premium = data.cleaners.filter((c) => c.isPremium).slice(0, 6);
    const free = data.cleaners.filter((c) => !c.isPremium).slice(0, 6);

    (async () => {
      const [p, f] = await Promise.all([
        hydrateCleanersWithPurchases(premium),
        hydrateCleanersWithPurchases(free),
      ]);
      setPremiumCleaners(p);
      setFreeCleaners(f);
    })();
  }, [data]);

  const handleBookingRequest = (cleanerId) => {
    const id = encodeURIComponent(String(cleanerId));
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId') : null;
    if (!clientId) router.push(`/login/clients?next=/cleaners/${id}`);
    else router.push(`/cleaners/${id}`);
  };

  const handleToggleFavourite = async (cleanerId) => {
    const id = String(cleanerId);
    const updated = favouriteIds.includes(id)
      ? favouriteIds.filter((x) => x !== id)
      : [...favouriteIds, id];
    setFavouriteIds(updated);
    try {
      localStorage.setItem('favourites', JSON.stringify(updated));
    } catch {}

    if (viewer?.type === 'client') {
      try {
        await fetch('/api/clients/toggle-favorite', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cleanerId: id }),
        });
      } catch {}
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (postcode.trim()) params.set('postcode', postcode.trim());
    if (serviceType) params.set('serviceType', serviceType);
    router.push(`/cleaners${params.toString() ? `?${params}` : ''}`);
  };

  const trustItems = useMemo(
    () => [
      'Verified cleaner profiles',
      'Availability shown upfront',
      'No endless quote chasing',
      'Cleaner approval before payment',
    ],
    []
  );

  return (
    <main className="site-shell">
      <PublicHeader ctaHref="/login" ctaLabel="Login" />

      <PageHero
        eyebrow="Book local cleaners with more confidence"
        title="Find trusted cleaners near you"
        description="Compare cleaner profiles, view real availability, and request bookings in minutes without the usual back-and-forth."
        actions={[
          <button key="primary" onClick={handleSearch} className="brand-button" type="button">
            Find a cleaner
          </button>,
          <Link key="secondary" href="/register/cleaners" className="brand-button-secondary">
            List your cleaning business
          </Link>,
        ]}
      />

      <section className="section-shell pb-8">
        <div className="surface-card p-6 sm:p-8">
          <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr,auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Postcode</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter your postcode"
                className="input"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Service</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="input">
                <option value="">Any cleaning service</option>
                <option value="Domestic Cleaning">Domestic cleaning</option>
                <option value="End of Tenancy">End of tenancy</option>
                <option value="Oven Cleaning">Oven cleaning</option>
                <option value="Window Cleaning">Window cleaning</option>
                <option value="Carpet Cleaning">Carpet cleaning</option>
              </select>
            </div>
            <button type="button" onClick={handleSearch} className="brand-button w-full lg:w-auto">
              Search cleaners
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item} className="soft-panel px-4 py-3 text-sm font-medium text-slate-700">
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Step number="1" title="Browse cleaners" text="Search your area and compare cleaner profiles with services, ratings, and profile details in one place." />
          <Step number="2" title="Request a slot" text="Choose a suitable time from the availability shown and send a booking request through the platform." />
          <Step number="3" title="Cleaner confirms" text="Your cleaner approves the request before payment completes, keeping the process clearer for both sides." />
        </div>
      </section>

      <section className="section-shell py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Featured listings</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Premium cleaners</h2>
          </div>
          <Link href="/cleaners" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
            View all cleaners
          </Link>
        </div>

        {isLoading ? (
          <LoadingRow text="Loading featured cleaners..." />
        ) : premiumCleaners.length === 0 ? (
          <div className="empty-state">No premium cleaners are available yet.</div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {premiumCleaners.map((cleaner) => (
              <CleanerCard
                key={cleaner._id}
                cleaner={cleaner}
                handleBookingRequest={handleBookingRequest}
                isPremium
                isFavourite={favouriteIds.includes(String(cleaner._id))}
                onToggleFavourite={(id) => handleToggleFavourite(String(id))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="section-shell py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="surface-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Why clients choose us</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">A simpler way to book local cleaning services</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                'Cleaner profiles are public and easy to compare.',
                'Availability is visible before you enquire.',
                'Bookings are requested through a cleaner-first approval flow.',
                'Clients and cleaners both get a clearer journey.',
              ].map((item) => (
                <div key={item} className="soft-panel p-4 text-sm leading-6 text-slate-600">{item}</div>
              ))}
            </div>
          </div>

          <div className="surface-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">For cleaners</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Want more direct booking requests?</h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Create a profile, add your services, set your availability, and receive requests from local clients through your dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/register/cleaners" className="brand-button">Register as a cleaner</Link>
              <Link href="/how-it-works" className="brand-button-secondary">See how it works</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">More cleaners</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">New and standard listings</h2>
          </div>
        </div>

        {isLoading ? (
          <LoadingRow text="Loading cleaners..." />
        ) : freeCleaners.length === 0 ? (
          <div className="empty-state">No standard cleaner listings are available yet.</div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {freeCleaners.map((cleaner) => (
              <CleanerCard
                key={cleaner._id}
                cleaner={cleaner}
                handleBookingRequest={handleBookingRequest}
                isFavourite={favouriteIds.includes(String(cleaner._id))}
                onToggleFavourite={(id) => handleToggleFavourite(String(id))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="section-shell py-14">
        <div className="surface-card px-6 py-10 text-center sm:px-10">
          <h2 className="text-3xl font-semibold text-slate-900">Ready to find a cleaner?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Start with your postcode, compare cleaner profiles, and request a booking that suits your schedule.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={handleSearch} className="brand-button">Search cleaners now</button>
            <Link href="/register/client" className="brand-button-secondary">Create a client account</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
