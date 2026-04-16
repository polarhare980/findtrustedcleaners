'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import CleanerCard from '@/components/CleanerCard';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';
import { injectPendingFromPurchases } from '@/lib/availability';
import { ALL_SERVICE_OPTIONS } from '@/lib/serviceOptions';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json());
const CLEANERS_API = '/api/public-cleaners';
const PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i));
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const CORE_LOCATION_LINKS = [
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
  const { data, isLoading } = useSWR(CLEANERS_API, fetcher);
  const [postcode, setPostcode] = useState('');
  const [serviceType, setServiceType] = useState('');
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_38%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />
      <section className="site-section pt-6 pb-2">
        <div className="rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Service</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="ftc-select">
                <option value="">All cleaning services</option>
                {ALL_SERVICE_OPTIONS.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Postcode</label>
              <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Enter your postcode" className="ftc-input" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Why people use FindTrustedCleaners</p>
              <div className="flex flex-wrap gap-2">
                <span className="ftc-chip">Verified cleaners</span>
                <span className="ftc-chip">Real availability</span>
                <span className="ftc-chip">Cleaner approval before payment</span>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-auto">
              <button onClick={() => router.push(`/cleaners?postcode=${encodeURIComponent(postcode)}${serviceType ? `&service=${encodeURIComponent(serviceType)}` : ''}`)} className="ftc-button-primary w-full lg:w-auto">Search now</button>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white"
              >
                Browse cleaning services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PageHero
        eyebrow="Trusted cleaner marketplace"
        title="Find trusted cleaners near you"
        description="Browse cleaner profiles for free, compare real availability, and send booking requests through a simpler, clearer marketplace."
        actions={(
          <>
            <button onClick={() => router.push(`/cleaners?postcode=${encodeURIComponent(postcode)}${serviceType ? `&service=${encodeURIComponent(serviceType)}` : ''}`)} className="ftc-button-primary">Find a cleaner</button>
            <Link href="/register/cleaners" className="ftc-button-secondary">Join as a cleaner</Link>
          </>
        )}
      />

      <section className="site-section pb-8">
        <div className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-teal-100 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.22),_transparent_34%),linear-gradient(135deg,#f7fffe_0%,#ecfdfa_48%,#ffffff_100%)] p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">Local price snapshots</span>
                  <span className="rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-semibold text-teal-800">
                    {postcode
                      ? `Showing ${postcode.toUpperCase()}`
                      : serviceScope === 'local'
                        ? `Near ${serviceArea?.outward || serviceArea?.label || 'you'}`
                        : 'Wider market view'}
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.15rem]">Popular services near you</h2>
                <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
                  Scroll across to compare live from-prices pulled from cleaner service profiles, then open the matching search results for that service.
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
                      className="group relative min-w-[280px] max-w-[280px] snap-start overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fffe_100%)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)] sm:min-w-[320px] sm:max-w-[320px]"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-700" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Service</p>
                          <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-900">{service.label}</h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-teal-50 px-3 py-2 text-center text-xs font-semibold text-teal-900 shadow-sm">
                          {service.cleanerCount} cleaner{service.cleanerCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="mt-5 rounded-[24px] border border-teal-100 bg-teal-50/70 p-4">
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

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
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

      <CleanerSection
        title="Featured local cleaners"
        isLoading={isLoading}
        cleaners={premiumCleaners}
        favouriteIds={favouriteIds}
        onToggleFavourite={handleToggleFavourite}
        onBookingRequest={handleBookingRequest}
        premium
      />

      <section className="site-section pb-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Browse for free', 'Search local cleaner profiles, compare services, and explore the marketplace without paying to browse.'],
            ['Check live details', 'See service pricing, profile information, and current availability before you commit.'],
            ['Request with confidence', 'Choose your cleaner and send a request. Payment only moves forward after approval.'],
          ].map(([title, text], index) => (
            <div key={title} className="surface-card p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">{index + 1}</div>
              <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section py-8">
        <div className="surface-muted p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Why choose us</p>
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
        title="More cleaners you can browse for free"
        subtitle={`Browse ${cleanerCount || 'our'} cleaner profiles for free and keep checking back as the network grows.`}
        isLoading={isLoading}
        cleaners={freeCleaners}
        favouriteIds={favouriteIds}
        onToggleFavourite={handleToggleFavourite}
        onBookingRequest={handleBookingRequest}
      />


      <section className="site-section py-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Double down on local intent</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Start with the areas we are building out hardest</h2>
            <p className="mt-4 max-w-3xl text-slate-600">Our core location pages are designed to support local search intent and help you jump straight into the strongest live marketplace areas first.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {CORE_LOCATION_LINKS.map((location) => (
                <Link
                  key={location.href}
                  href={location.href}
                  className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white"
                >
                  Cleaners in {location.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Core services</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Browse the main booking pages</h2>
            <p className="mt-4 text-slate-600">These are the four service pages we want Google and visitors reaching quickly from all over the site.</p>
            <div className="mt-6 grid gap-3">
              {CORE_SERVICE_LINKS.map((service) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:text-teal-800"
                >
                  {service.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="site-section py-8">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Worthing flagship page</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">See the strongest local marketplace page in action</h2>
              <p className="mt-4 text-slate-600">Worthing is being treated as the lead local page, with service links, live cleaner visibility, nearby area support, and a stronger route into bookable profiles.</p>
            </div>
            <Link href="/locations/worthing" className="ftc-button-primary">View cleaners in Worthing</Link>
          </div>
        </div>
      </section>

      <section className="site-section py-12">
        <div className="rounded-[32px] border border-white/70 bg-white/88 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">For cleaners</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Want to win more direct booking requests?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">Join the marketplace for free, set your availability, and start getting discovered. Upgrade to premium when you want stronger visibility and a more powerful profile presence.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register/cleaners" className="ftc-button-primary">Create cleaner profile</Link>
            <Link href="/how-it-works" className="ftc-button-secondary">See how it works</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function CleanerSection({ title, subtitle, cleaners, isLoading, favouriteIds, onToggleFavourite, onBookingRequest, premium = false }) {
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  return (
    <section className="site-section py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {premium ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollRail('left')}
                aria-label="Scroll premium cleaners left"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollRail('right')}
                aria-label="Scroll premium cleaners right"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
              >
                →
              </button>
            </div>
          ) : null}
          <Link href="/cleaners" className="ftc-button-secondary">View all cleaners</Link>
        </div>
      </div>

      {isLoading ? (
        <div className="surface-card p-8 text-slate-600">Loading cleaners…</div>
      ) : !cleaners?.length ? (
        <div className="surface-card p-8 text-slate-600">No cleaners are available here yet.</div>
      ) : (
        <div ref={railRef} className="flex gap-5 overflow-x-auto pb-2 hide-scrollbar-mobile scroll-smooth">
          {cleaners.map((cleaner) => (
            <div key={cleaner._id} className="min-w-[280px] shrink-0 sm:min-w-[320px]">
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
    </section>
  );
}