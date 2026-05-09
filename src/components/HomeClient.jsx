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
    const premium = data.cleaners.filter((c) => c.isPremium).slice(0, 6);
    const standard = data.cleaners.filter((c) => !c.isPremium).slice(0, 6);
    (async () => {
      const [p, f] = await Promise.all([hydrateCleanersWithPurchases(premium), hydrateCleanersWithPurchases(standard)]);
      setPremiumCleaners(p);
      setFreeCleaners(f);
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


  const locationLabel = data?.location?.locationConfidence === 'exact'
    ? 'Showing cleaners matched to your exact area'
    : postcode
      ? `Showing cleaners near ${postcode.toUpperCase()}`
      : data?.location?.locationConfidence === 'approximate'
        ? 'Showing cleaners matched to your approximate area'
        : 'Showing available cleaners across West Sussex';

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />
      <PremiumMatchingHero
        cleanerCount={cleanerCount}
        onSearchClick={() => router.push('/cleaners')}
      />
      <CleanerSection
        eyebrow=""
        title="Available cleaners today"
        subtitle={locationLabel}
        locationError={locationError}
        locationAction={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={requestExactLocation}
              disabled={isLocating}
              className="rounded-full border border-[#0C8FA3]/25 bg-white px-3 py-2 text-xs font-bold text-[#076D7E] shadow-sm transition hover:border-[#0C8FA3]/45 hover:bg-[#EAFBFB] disabled:cursor-wait disabled:opacity-70"
            >
              {isLocating ? 'Finding your area…' : 'Use my exact area'}
            </button>
            <Link href="/cleaners" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#0C8FA3]/25 hover:text-[#0C8FA3]">
              Change location
            </Link>
          </div>
        }
        isLoading={isLoading}
        cleaners={premiumCleaners}
        favouriteIds={favouriteIds}
        onToggleFavourite={handleToggleFavourite}
        onBookingRequest={handleBookingRequest}
        premium
      />

      <section className="site-section pb-8">
        <div className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-[#0C8FA3]/15 bg-[radial-gradient(circle_at_top_left,_rgba(12,143,163,0.18),_transparent_34%),linear-gradient(135deg,#f7fbfa_0%,#eafbfb_48%,#ffffff_100%)] p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#0C8FA3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">Local price snapshots</span>
                  <span className="rounded-full border border-[#0C8FA3]/25 bg-white/80 px-3 py-1 text-xs font-semibold text-[#076D7E]">
                    {postcode
                      ? `Showing ${postcode.toUpperCase()}`
                      : serviceScope === 'local'
                        ? `Near ${serviceArea?.outward || serviceArea?.label || 'you'}`
                        : 'Wider market view'}
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.15rem]">Popular cleaning services in your area</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600/85 sm:text-base">
                  Compare trusted local cleaners by service, pricing and availability across your area.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/cleaners" className="ftc-button-primary">Browse all services</Link>
                <p className="inline-flex items-center rounded-full border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-600">
                  {postcode
                    ? 'Showing prices for your searched area.'
                    : serviceArea?.outward
                      ? `Using nearby pricing around ${serviceArea.outward}.`
                      : 'Add a postcode above to tighten local pricing.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            {isLoadingServiceMarket ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                Loading local service pricing…
              </div>
            ) : !serviceMarket.length ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
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
                      className="group relative min-w-[280px] max-w-[280px] snap-start overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfa_100%)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#0C8FA3]/25 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)] sm:min-w-[320px] sm:max-w-[320px]"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0C8FA3] via-[#21B6C7] to-[#076D7E]" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0C8FA3]">Service</p>
                          <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-900">{service.label}</h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#EAFBFB] px-3 py-2 text-center text-xs font-semibold text-[#064C59] shadow-sm">
                          {service.cleanerCount} cleaner{service.cleanerCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="mt-5 rounded-[24px] border border-[#0C8FA3]/15 bg-[#EAFBFB]/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">From price</p>
                        <div className="mt-2 flex items-end gap-2">
                          <span className="text-4xl font-black tracking-tight text-slate-900">
                            {service.minPrice != null ? `£${service.minPrice}` : 'Quote'}
                          </span>
                          <span className="pb-1 text-sm font-medium text-slate-500">
                            {service.minPrice != null ? 'on profile' : 'on request'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {serviceScope === 'local' ? `Local${serviceArea?.outward ? ` · ${serviceArea.outward}` : ''}` : 'Marketplace'}
                        </span>
                        {service.avgDurationMins ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">{service.avgDurationMins} mins avg</span>
                        ) : null}
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {service.pricedCount || 0} priced
                        </span>
                      </div>

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0C8FA3]">
                        View matching cleaners
                        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
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
        <div className="surface-muted p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0C8FA3]">Why choose us</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">A simpler way to book cleaning services</h2>
              <p className="mt-4 text-slate-600">Large marketplaces can rely on brand recognition and hard sell tactics. We focus on clarity instead: free browsing for clients, free basic listings for cleaners, and an optional premium upgrade for businesses that want stronger visibility.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Free to browse for clients', 'Free basic listing for cleaners', 'Premium upgrade is optional', 'Built for UK households and local businesses'].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CleanerSection
        eyebrow="More local options"
        title="Browse more cleaners"
        subtitle={
          localAreaLabel
            ? `See more cleaner profiles covering ${localAreaLabel}, including domestic cleaning, deep cleaning and specialist services.`
            : `Browse ${cleanerCount || 'our'} cleaner profiles for domestic cleaning, deep cleaning and specialist services.`
        }
        isLoading={isLoading}
        cleaners={freeCleaners}
        favouriteIds={favouriteIds}
        onToggleFavourite={handleToggleFavourite}
        onBookingRequest={handleBookingRequest}
      />


      <section className="site-section py-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0C8FA3]">Find Trusted Cleaners Near You</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Find cleaners in your area</h2>
            <p className="mt-4 max-w-3xl text-slate-600">We currently have the strongest availability in Worthing, Lancing and Shoreham-by-Sea, making it easier to find trusted cleaners and book quickly.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {CORE_LOCATION_LINKS.map((location) => (
                <Link
                  key={location.href}
                  href={location.href}
                  className="rounded-full border border-[#0C8FA3]/25 bg-[#EAFBFB] px-4 py-2 text-sm font-semibold text-[#076D7E] transition hover:-translate-y-0.5 hover:border-[#21B6C7] hover:bg-white"
                >
                  Cleaners in {location.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0C8FA3]">Core services</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Browse cleaning services</h2>
            <p className="mt-4 text-slate-600">Choose the type of cleaning you need and find available cleaners near you.</p>
            <div className="mt-6 grid gap-3">
              {CORE_SERVICE_LINKS.map((service) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-[#0C8FA3]/25 hover:bg-white hover:text-[#076D7E]"
                >
                  {service.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <RegionalSeoMesh locationName="West Sussex" compact />

      <AuthorityTrustPanel
        title="A stronger local alternative to national cleaning directories"
        intro="The West Sussex patch links county coverage, town pages, services, guides and cleaner profiles together so the site can build authority before expanding into East Sussex."
      />

      <section className="site-section py-8">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0C8FA3]">Worthing flagship page</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">See the strongest local marketplace page in action</h2>
              <p className="mt-4 text-slate-600">Worthing is being treated as the lead local page, with service links, live cleaner visibility, nearby area support, and a stronger route into bookable profiles.</p>
            </div>
            <Link href="/locations/worthing" className="ftc-button-primary">View cleaners in Worthing</Link>
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
                isPremium={premium || cleaner.isPremium}
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