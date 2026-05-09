'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import CleanerCard from '@/components/CleanerCard';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PremiumMatchingHero from '@/components/ui/PremiumMatchingHero';
import { injectPendingFromPurchases } from '@/lib/availability';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json());
const CLEANERS_API = '/api/cleaners/matched';
const PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i));
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const CORE_LOCATION_LINKS = [
  { href: '/locations/west-sussex', label: 'West Sussex' },
  { href: '/locations/worthing', label: 'Worthing' },
  { href: '/locations/lancing', label: 'Lancing' },
  { href: '/locations/shoreham-by-sea', label: 'Shoreham-by-Sea' },
  { href: '/locations/littlehampton', label: 'Littlehampton' },
  { href: '/locations/angmering', label: 'Angmering' },
  { href: '/locations/rustington', label: 'Rustington' },
  { href: '/locations/bognor-regis', label: 'Bognor Regis' },
  { href: '/locations/chichester', label: 'Chichester' },
];

const CORE_SERVICE_LINKS = [
  { href: '/services/end-of-tenancy-cleaning', label: 'End of tenancy cleaning' },
  { href: '/services/deep-cleaning', label: 'Deep cleaning' },
  { href: '/services/regular-cleaning', label: 'Regular cleaning' },
  { href: '/services/oven-cleaning', label: 'Oven cleaning' },
];


const CLEANING_PATHS = [
  {
    id: 'home',
    label: 'Home Cleaning',
    description: 'Weekly, regular or one-off home cleaning.',
    detail: 'Best for regular cleaning, deep cleans, moving house and general home help.',
    services: ['Regular Cleaning', 'One-Off Deep Clean', 'End of Tenancy', 'Moving House Cleaning'],
  },
  {
    id: 'specialist',
    label: 'Specialist Cleaning',
    description: 'Ovens, carpets, windows, gutters and more.',
    detail: 'Best for one-off specialist jobs around the home or outside space.',
    services: ['Oven Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'Pressure Washing', 'Gutter Cleaning'],
  },
];

const TIME_PREFERENCES = ['Any time', 'Weekday morning', 'Weekday afternoon', 'Evening', 'Weekend'];


function buildMatchedCleanersUrl({ postcode = '', lat = '', lng = '', radius = '8' } = {}) {
  const params = new URLSearchParams();
  if (postcode.trim()) params.set('postcode', postcode.trim());
  if (lat && lng) {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }
  if (radius) params.set('radius', radius);
  const query = params.toString();
  return `${CLEANERS_API}${query ? `?${query}` : ''}`;
}

function buildCleanerSearchUrl({ postcode = '', serviceType = '', cleaningPath = '', timePreference = '' } = {}) {
  const params = new URLSearchParams();
  if (postcode.trim()) params.set('postcode', postcode.trim());
  if (serviceType.trim()) params.set('service', serviceType.trim());
  if (cleaningPath) params.set('path', cleaningPath);
  if (timePreference && timePreference !== 'Any time') params.set('time', timePreference);
  const query = params.toString();
  return `/cleaners${query ? `?${query}` : ''}`;
}

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
      out[dayName][hour] = Object.prototype.hasOwnProperty.call(overrideDay, hour) ? overrideDay[hour] : baseDay?.[hour];
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
        return {
          ...c,
          availabilityMerged:
            injectPendingFromPurchases?.(
              composeCurrentWeekAvailability(c.availability || {}, c.availabilityOverrides || {}),
              purchases
            ) ?? composeCurrentWeekAvailability(c.availability || {}, c.availabilityOverrides || {}),
        };
      } catch {
        return { ...c, availabilityMerged: c.availability || {} };
      }
    })
  );
}

export default function HomeClient() {
  const router = useRouter();
  const [postcode, setPostcode] = useState('');
  const [exactLocation, setExactLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const matchedCleanersUrl = useMemo(() => buildMatchedCleanersUrl({ postcode, lat: exactLocation?.lat, lng: exactLocation?.lng }), [postcode, exactLocation]);
  const { data, isLoading } = useSWR(matchedCleanersUrl, fetcher);
  const [serviceType, setServiceType] = useState('');
  const [cleaningPath, setCleaningPath] = useState('home');
  const [timePreference, setTimePreference] = useState('Any time');
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [premiumCleaners, setPremiumCleaners] = useState([]);
  const [freeCleaners, setFreeCleaners] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('favourites') || '[]');
      setFavouriteIds(Array.isArray(saved) ? saved.map(String) : []);
    } catch {}
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (live && res.ok && data?.success) setViewer(data.user || null);
      } catch {}
    })();
  return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!data?.success || !Array.isArray(data.cleaners)) return;

    // The API already sorts by availability first, then locality, then trust signals.
    // Keep the homepage feeling live: show the strongest matches first, regardless of account type.
    const topMatches = data.cleaners.slice(0, 8);
    const moreMatches = data.cleaners.slice(8, 14);

    (async () => {
      const [top, more] = await Promise.all([
        hydrateCleanersWithPurchases(topMatches),
        hydrateCleanersWithPurchases(moreMatches),
      ]);
      setPremiumCleaners(top);
      setFreeCleaners(more);
    })();
  }, [data]);


  const requestExactLocation = () => {
    setLocationError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Your browser does not support exact location. Enter a postcode instead.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setExactLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError('Location permission was not allowed. You can still enter a postcode.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 1000 * 60 * 10 }
    );
  };

  const handleToggleFavourite = async (cleanerId) => {
    const id = String(cleanerId);
    const updated = favouriteIds.includes(id) ? favouriteIds.filter((x) => x !== id) : [...favouriteIds, id];
    setFavouriteIds(updated);
    try { localStorage.setItem('favourites', JSON.stringify(updated)); } catch {}
    if (viewer?.type === 'client') {
      try {
        await fetch('/api/clients/toggle-favorite', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cleanerId: id }),
        });
      } catch {}
    }
  };

  const handleBookingRequest = (cleanerId) => {
    const id = encodeURIComponent(String(cleanerId));
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId') : null;
    if (!clientId) router.push(`/login/clients?next=/cleaners/${id}`);
    else router.push(`/cleaners/${id}`);
  };

  const cleanerCount = useMemo(() => Array.isArray(data?.cleaners) ? data.cleaners.length : 0, [data]);
  const serviceMarketUrl = postcode
    ? `/api/service-marketplace?postcode=${encodeURIComponent(postcode)}&service=${encodeURIComponent(serviceType || '')}`
    : `/api/service-marketplace?service=${encodeURIComponent(serviceType || '')}`;
  const { data: serviceMarketData, isLoading: isLoadingServiceMarket } = useSWR(serviceMarketUrl, fetcher);
  const serviceMarket = useMemo(() => Array.isArray(serviceMarketData?.serviceMarket) ? serviceMarketData.serviceMarket : [], [serviceMarketData]);
  const serviceArea = serviceMarketData?.area || null;
  const serviceScope = serviceMarketData?.scope || 'national';
  const localAreaLabel = postcode
    ? postcode.toUpperCase()
    : serviceArea?.label || serviceArea?.outward || null;


  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(12,143,163,0.14),transparent_32rem),radial-gradient(circle_at_88%_18%,rgba(15,23,42,0.08),transparent_28rem),linear-gradient(180deg,#f3f8fa_0%,#e8f1f5_44%,#dfeaf0_100%)] text-slate-900">
      <PublicHeader />
      <PremiumMatchingHero
        cleanerCount={cleanerCount}
        onSearchClick={() => router.push('/cleaners')}
      />
      <CleanerSection
        eyebrow=""
        title="Available cleaners today"
        subtitle=""
        locationError={locationError}
        locationAction={
          <Link href="/cleaners" className="whitespace-nowrap text-xs font-bold text-slate-500 transition hover:text-[#0C8FA3]">
            Change location
          </Link>
        }
        isLoading={isLoading}
        cleaners={premiumCleaners}
        favouriteIds={favouriteIds}
        onToggleFavourite={handleToggleFavourite}
        onBookingRequest={handleBookingRequest}
        premium
      />

      <section className="site-section pb-8">
        <div
          className="relative overflow-hidden rounded-[34px] border border-white/20 bg-slate-950 shadow-[0_26px_90px_rgba(15,23,42,0.22)]"
          style={{
            backgroundImage:
              "linear-gradient(115deg, rgba(15,23,42,0.76) 0%, rgba(15,23,42,0.58) 48%, rgba(12,143,163,0.34) 100%), url('/images/service-cards-kitchen-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28rem),radial-gradient(circle_at_80%_10%,rgba(33,182,199,0.24),transparent_22rem)]" />
          <div className="relative p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-sm backdrop-blur-md">
                Local price snapshots
              </span>
              <Link href="/services" className="hidden text-sm font-bold text-white/80 transition hover:text-white sm:inline-flex">
                View services →
              </Link>
            </div>

            {isLoadingServiceMarket ? (
              <div className="rounded-[28px] border border-white/20 bg-white/14 px-5 py-10 text-center text-sm text-white/80 shadow-sm backdrop-blur-xl">
                Loading local service pricing…
              </div>
            ) : !serviceMarket.length ? (
              <div className="rounded-[28px] border border-white/20 bg-white/14 px-5 py-10 text-center text-sm text-white/80 shadow-sm backdrop-blur-xl">
                Service pricing cards will appear here automatically as cleaners add priced services to their profile.
              </div>
            ) : (
              <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {serviceMarket.map((service) => {
                  const appliedPostcode = postcode || serviceArea?.outward || '';
                  const href = `/cleaners?service=${encodeURIComponent(service.label)}${appliedPostcode ? `&postcode=${encodeURIComponent(appliedPostcode)}` : ''}`;

                  return (
                    <Link
                      key={service.key}
                      href={href}
                      className="group relative min-w-[245px] max-w-[245px] snap-start overflow-hidden rounded-[30px] border border-white/25 bg-white/18 p-5 text-white shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/24 hover:shadow-[0_24px_70px_rgba(0,0,0,0.26)] sm:min-w-[285px] sm:max-w-[285px]"
                    >
                      <div className="absolute inset-x-5 top-0 h-1 rounded-full bg-gradient-to-r from-[#6EE7F2] via-white/80 to-[#0C8FA3]" />

                      <div className="relative flex min-h-[178px] flex-col justify-between">
                        <div>
                          <h3 className="max-w-[12rem] text-2xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                            {service.label}
                          </h3>
                          <p className="mt-2 text-sm font-semibold text-white/70">
                            {service.cleanerCount} cleaner{service.cleanerCount === 1 ? '' : 's'} nearby
                          </p>
                        </div>

                        <div>
                          <div className="rounded-[24px] border border-white/22 bg-white/16 p-4 shadow-inner backdrop-blur-xl">
                            <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-white/62">From</p>
                            <div className="mt-1 flex items-end gap-2">
                              <span className="text-4xl font-black tracking-tight text-white">
                                {service.minPrice != null ? `£${service.minPrice}` : 'Quote'}
                              </span>
                              <span className="pb-1 text-sm font-semibold text-white/65">
                                {service.minPrice != null ? 'per clean' : 'on request'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white">
                            View cleaners
                            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="site-section py-8">
        <div className="relative overflow-hidden rounded-[34px] bg-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/why-choose-cleaners-bg.png')" }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/68 to-slate-950/24" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/88 to-transparent" />

          <div className="relative min-h-[480px] px-7 py-12 sm:px-10 lg:flex lg:min-h-[540px] lg:items-center lg:px-14">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#30D5C8]">Trusted local cleaners</p>
              <h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Booking a cleaner should feel simple.
              </h2>
              <p className="mt-5 max-w-lg text-base font-medium leading-7 text-white/78 sm:text-lg">
                Browse local cleaners with live availability, clear profiles and trusted reviews.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/cleaners"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#0C8FA3] to-[#12C8BA] px-7 text-base font-black text-white shadow-[0_16px_36px_rgba(12,143,163,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(12,143,163,0.42)]"
                >
                  Find cleaners
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-white/42 bg-white/8 px-7 text-base font-black text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/14"
                >
                  How it works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section py-10">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(7,15,28,0.96),rgba(12,28,45,0.92))] shadow-[0_35px_100px_rgba(2,8,23,0.45)]">
          <div className="relative p-8 sm:p-12 lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_28%)]" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">LOCAL AREAS</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Find cleaners near you</h2>
              <p className="mt-5 text-lg text-slate-300">Explore trusted local cleaners across West Sussex.</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link href="/locations" className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/16">
                  Explore areas →
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/60">
                <Link href="/locations/worthing" className="transition hover:text-white">Worthing</Link>
                <span>·</span>
                <Link href="/locations/lancing" className="transition hover:text-white">Lancing</Link>
                <span>·</span>
                <Link href="/locations/shoreham-by-sea" className="transition hover:text-white">Shoreham</Link>
                <span>·</span>
                <Link href="/locations/littlehampton" className="transition hover:text-white">Littlehampton</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section py-8">
        <div className="rounded-[36px] border border-white/60 bg-white/80 p-8 shadow-[0_25px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0C8FA3]">SERVICES</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Choose the cleaning service you need</h2>
            </div>
            <Link href="/services" className="text-sm font-semibold text-[#0C8FA3] transition hover:text-slate-900">
              Browse services →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Regular cleaning', href: '/services/regular-cleaning' },
              { label: 'Deep cleaning', href: '/services/deep-cleaning' },
              { label: 'End of tenancy', href: '/services/end-of-tenancy-cleaning' },
              { label: 'Oven cleaning', href: '/services/oven-cleaning' },
              { label: 'Carpet cleaning', href: '/services/carpet-cleaning' },
            ].map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className="group rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(240,249,255,0.72))] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-[#0C8FA3]/30"
              >
                <div className="flex min-h-[120px] flex-col justify-between">
                  <span className="text-lg font-semibold tracking-tight text-slate-900">{service.label}</span>
                  <span className="text-sm text-[#0C8FA3] transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section py-8">
        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,#07111f,#0f172a)] p-8 shadow-[0_35px_100px_rgba(2,8,23,0.4)] sm:p-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              'Verified cleaner profiles',
              'Live availability',
              'Transparent pricing',
              'Built for UK households',
            ].map((item) => (
              <div key={item} className="rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-5 h-10 w-10 rounded-full bg-teal-400/15 ring-1 ring-teal-300/20" />
                <p className="text-base font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section py-8">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(6,12,24,0.96),rgba(15,23,42,0.92))] shadow-[0_35px_100px_rgba(2,8,23,0.45)]">
          <div className="relative p-8 sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.15),transparent_30%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Explore cleaners in Worthing</h2>
                <p className="mt-4 text-slate-300">See local cleaner availability, pricing and trusted profiles.</p>
              </div>
              <Link href="/locations/worthing" className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/16">
                View Worthing cleaners →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section py-12">
        <div className="rounded-[32px] border border-white/70 bg-white/88 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0C8FA3]">For cleaners</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Want to win more direct booking requests?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">Join the marketplace for free, set your availability, and start getting discovered. Upgrade to premium when you want stronger visibility and a more powerful profile presence.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register/cleaners" className="ftc-button-primary">Create cleaner profile</Link>
            <Link href="/about" className="ftc-button-secondary">About FindTrustedCleaners</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function CleanerSection({ eyebrow, title, subtitle, locationError, locationAction, cleaners, isLoading, favouriteIds, onToggleFavourite, onBookingRequest, premium = false }) {
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  return (
    <section className={premium ? "site-section py-8" : "site-section py-8"}>
      <div className={premium ? "overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(12,143,163,0.10),transparent_34%),linear-gradient(180deg,#f7ffff_0%,#ffffff_100%)] p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-5" : ""}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0C8FA3]">{eyebrow}</p> : null}
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600/85 sm:text-base">{subtitle}</p> : null}
          {locationError ? <p className="mt-2 max-w-2xl text-xs font-medium text-amber-700">{locationError}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {locationAction || null}
          {premium ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollRail('left')}
                aria-label="Scroll premium cleaners left"
                className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:border-[#0C8FA3]/25 hover:text-[#0C8FA3]"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollRail('right')}
                aria-label="Scroll premium cleaners right"
                className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:border-[#0C8FA3]/25 hover:text-[#0C8FA3]"
              >
                →
              </button>
            </div>
          ) : null}
          <Link href="/cleaners" className="whitespace-nowrap text-sm font-semibold text-slate-500 transition hover:text-[#0C8FA3]">Browse all →</Link>
        </div>
      </div>

      {isLoading ? (
        <div className="surface-card p-8 text-slate-600">Loading cleaners…</div>
      ) : !cleaners?.length ? (
        <div className="surface-card p-8 text-slate-600">No cleaners are available here yet.</div>
      ) : (
        <div ref={railRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2 hide-scrollbar-mobile scroll-smooth">
          {cleaners.map((cleaner) => (
            <div key={cleaner._id} className="min-w-[260px] max-w-[260px] shrink-0 snap-start sm:min-w-[285px] sm:max-w-[285px]">
              <CleanerCard
                cleaner={cleaner}
                handleBookingRequest={onBookingRequest}
                isPremium={cleaner.isPremium}
                isFavourite={favouriteIds.includes(String(cleaner._id))}
                onToggleFavourite={(id) => onToggleFavourite(String(id))}
              />
            </div>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}