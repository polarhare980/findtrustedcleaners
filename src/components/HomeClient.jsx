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
import RegionalSeoMesh from '@/components/seo/RegionalSeoMesh';
import AuthorityTrustPanel from '@/components/seo/AuthorityTrustPanel';

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
      <div className="relative isolate overflow-hidden pb-0">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_4%,rgba(12,143,163,0.18),transparent_30rem),radial-gradient(circle_at_86%_26%,rgba(18,200,186,0.14),transparent_28rem),linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(238,249,251,0.78)_15%,rgba(226,241,246,0.86)_32%,rgba(218,235,242,0.82)_48%,rgba(15,23,42,0.92)_72%,rgba(15,23,42,0.98)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/0 via-white/42 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[34rem] h-72 bg-gradient-to-b from-transparent via-[#e9f5f8]/80 to-transparent" />

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

        <section className="relative z-10 -mt-4 py-0 sm:-mt-7">
          <div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-none border-0 bg-slate-950 shadow-none sm:rounded-[44px] sm:shadow-[0_34px_110px_rgba(15,23,42,0.18)]"
            style={{
              backgroundImage:
                "linear-gradient(115deg, rgba(15,23,42,0.62) 0%, rgba(15,23,42,0.42) 46%, rgba(12,143,163,0.24) 100%), url('/images/service-cards-kitchen-bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.20),transparent_30rem),radial-gradient(circle_at_80%_10%,rgba(33,182,199,0.20),transparent_22rem)]" />
            <div className="relative p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/16 bg-white/12 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.24em] text-white/86 shadow-sm backdrop-blur-md">
                  Local price snapshots
                </span>
                <Link href="/services" className="hidden text-sm font-bold text-white/76 transition hover:text-white sm:inline-flex">
                  View services →
                </Link>
              </div>

              {isLoadingServiceMarket ? (
                <div className="rounded-[26px] border border-white/12 bg-white/10 px-5 py-10 text-center text-sm text-white/76 backdrop-blur-xl">
                  Loading local service pricing…
                </div>
              ) : !serviceMarket.length ? (
                <div className="rounded-[26px] border border-white/12 bg-white/10 px-5 py-10 text-center text-sm text-white/76 backdrop-blur-xl">
                  Price snapshots will appear as more local cleaners add services.
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
                        className="group relative min-w-[245px] max-w-[245px] snap-start overflow-hidden rounded-[30px] border border-white/18 bg-white/14 p-5 text-white shadow-[0_18px_55px_rgba(0,0,0,0.14)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/20 hover:shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:min-w-[285px] sm:max-w-[285px]"
                      >
                        <div className="absolute inset-x-6 top-0 h-1 rounded-full bg-gradient-to-r from-[#6EE7F2]/80 via-white/70 to-[#0C8FA3]/80" />
                        <div className="relative flex min-h-[174px] flex-col justify-between">
                          <div>
                            <h3 className="max-w-[12rem] text-2xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                              {service.label}
                            </h3>
                            <p className="mt-2 text-sm font-semibold text-white/66">
                              {service.cleanerCount} cleaner{service.cleanerCount === 1 ? '' : 's'} nearby
                            </p>
                          </div>

                          <div>
                            <div className="rounded-[24px] border border-white/16 bg-white/14 p-4 shadow-inner backdrop-blur-xl">
                              <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-white/56">From</p>
                              <div className="mt-1 flex items-end gap-2">
                                <span className="text-4xl font-black tracking-tight text-white">
                                  {service.minPrice != null ? `£${service.minPrice}` : 'Quote'}
                                </span>
                                <span className="pb-1 text-sm font-semibold text-white/62">
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

        <section className="relative z-10 -mt-px py-0">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-none bg-slate-950 shadow-none sm:rounded-[44px] sm:shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/why-choose-cleaners-bg.png')" }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/20" />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/6 to-transparent" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/88 to-transparent" />

            <div className="relative min-h-[480px] px-7 py-12 sm:px-10 lg:flex lg:min-h-[540px] lg:items-center lg:px-14">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#30D5C8]">Trusted local cleaners</p>
                <h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Booking a cleaner should feel simple.
                </h2>
                <p className="mt-5 max-w-lg text-base font-medium leading-7 text-white/76 sm:text-lg">
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
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-white/34 bg-white/8 px-7 text-base font-black text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/14"
                  >
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-px py-0">
          <div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-none bg-slate-950 shadow-none sm:rounded-[44px] sm:shadow-[0_28px_85px_rgba(15,23,42,0.18)]"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(15,23,42,0.88), rgba(15,23,42,0.56), rgba(12,143,163,0.22)), url('/images/homepage-hero.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(48,213,200,0.18),transparent_22rem)]" />
            <div className="relative max-w-2xl px-7 py-14 sm:px-10 lg:px-14 lg:py-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#30D5C8]">Local areas</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Find cleaners near you</h2>
              <p className="mt-4 text-base font-medium leading-7 text-white/75 sm:text-lg">Explore trusted local cleaners across West Sussex.</p>
              <Link href="/locations" className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-slate-950 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#EAFBFB]">
                Explore areas →
              </Link>
              <div className="mt-7 flex flex-wrap gap-x-3 gap-y-2 text-sm font-bold text-white/62">
                {CORE_LOCATION_LINKS.slice(1, 5).map((location, index) => (
                  <React.Fragment key={location.href}>
                    <Link href={location.href} className="transition hover:text-white">{location.label}</Link>
                    {index < 3 ? <span aria-hidden="true">·</span> : null}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-px py-0">
          <div className="mx-auto grid max-w-7xl gap-5 bg-gradient-to-b from-slate-950 via-slate-900 to-[#e8f4f7] px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:rounded-[44px] lg:px-10">
            <div className="px-1 sm:px-3">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#30D5C8]">Services</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Choose the cleaning service you need</h2>
              <Link href="/services" className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-slate-950 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#EAFBFB]">
                Browse services →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {CORE_SERVICE_LINKS.concat([{ href: '/services/carpet-cleaning', label: 'Carpet cleaning' }]).slice(0, 5).map((service) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className="group flex min-h-[112px] items-end justify-between rounded-[28px] border border-white/12 bg-white/10 p-5 text-white shadow-[0_18px_55px_rgba(0,0,0,0.10)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/16 hover:shadow-[0_24px_70px_rgba(0,0,0,0.18)]"
                >
                  <span className="text-xl font-black tracking-tight">{service.label.replace(' cleaning', '')}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#EAFBFB] text-[#0C8FA3] transition group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-px py-0">
          <div className="mx-auto grid max-w-7xl gap-3 bg-slate-950/96 p-5 shadow-none backdrop-blur-xl sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:rounded-[44px]">
            {[
              'Verified cleaner profiles',
              'Live availability',
              'Transparent pricing',
              'Built for UK households',
            ].map((item) => (
              <div key={item} className="rounded-[26px] border border-white/10 bg-white/8 p-5 text-white shadow-inner backdrop-blur-xl">
                <div className="mb-4 h-1.5 w-10 rounded-full bg-gradient-to-r from-[#0C8FA3] to-[#30D5C8]" />
                <p className="text-base font-black leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 -mt-px py-0">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-none border-0 bg-slate-950 shadow-none sm:rounded-[44px] sm:shadow-[0_28px_90px_rgba(15,23,42,0.20)]">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(48,213,200,0.18),transparent_24rem),radial-gradient(circle_at_86%_28%,rgba(255,255,255,0.10),transparent_18rem)]" />
            <div className="relative flex flex-col gap-7 px-7 py-12 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-16">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#30D5C8]">Worthing</p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Explore cleaners in Worthing</h2>
                <p className="mt-4 text-base font-medium leading-7 text-white/72 sm:text-lg">See local cleaner availability, pricing and trusted profiles.</p>
              </div>
              <Link href="/locations/worthing" className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-white px-7 text-sm font-black text-slate-950 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#EAFBFB]">
                View Worthing cleaners →
              </Link>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-px pb-14 sm:pb-18">
          <div className="mx-auto max-w-7xl bg-gradient-to-b from-[#e8f4f7] to-white/75 p-8 text-center shadow-none backdrop-blur-xl sm:rounded-t-[44px] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0C8FA3]">For cleaners</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Want to win more direct booking requests?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">Join for free, set your availability, and get discovered by local households.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register/cleaners" className="ftc-button-primary">Create cleaner profile</Link>
              <Link href="/about" className="ftc-button-secondary">About FindTrustedCleaners</Link>
            </div>
          </div>
        </section>

        <div className="sr-only" aria-hidden="true">
          <nav aria-label="SEO location and service links">
            {CORE_LOCATION_LINKS.map((location) => <Link key={location.href} href={location.href}>{location.label}</Link>)}
            {CORE_SERVICE_LINKS.map((service) => <Link key={service.href} href={service.href}>{service.label}</Link>)}
          </nav>
          <RegionalSeoMesh locationName="West Sussex" compact />
          <AuthorityTrustPanel
            title="A stronger local alternative to national cleaning directories"
            intro="The West Sussex patch links county coverage, town pages, services, guides and cleaner profiles together so the site can build authority before expanding into East Sussex."
          />
        </div>
      </div>

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
    <section className={premium ? "relative z-20 -mt-5 pb-0 sm:-mt-8" : "site-section relative py-8"}>
      <div className={premium ? "mx-auto max-w-7xl overflow-visible bg-transparent px-4 py-7 sm:px-6 sm:py-9 lg:px-8" : ""}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0C8FA3]">{eyebrow}</p> : null}
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
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

        </div>
      </div>

      {isLoading ? (
        <div className="surface-card p-8 text-slate-600">Loading cleaners…</div>
      ) : !cleaners?.length ? (
        <div className="rounded-[26px] border border-white/55 bg-white/50 p-8 text-slate-600 shadow-sm backdrop-blur-xl">New cleaners coming soon.</div>
      ) : (
        <div ref={railRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-6 hide-scrollbar-mobile scroll-smooth [mask-image:linear-gradient(90deg,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]">
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