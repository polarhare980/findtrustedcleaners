'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

function resolveCleanerImage(cleaner) {
  const directImage = typeof cleaner?.image === 'string' ? cleaner.image.trim() : '';
  if (directImage) return directImage;

  const legacyProfileImage = typeof cleaner?.profileImage === 'string' ? cleaner.profileImage.trim() : '';
  if (legacyProfileImage) return legacyProfileImage;

  if (Array.isArray(cleaner?.photos)) {
    for (const photo of cleaner.photos) {
      if (typeof photo === 'string' && photo.trim()) return photo.trim();
      if (photo && typeof photo.url === 'string' && photo.url.trim()) return photo.url.trim();
    }
  }

  return '/default-avatar.png';
}

export default function FindCleanerPage() {
  const searchParams = useSearchParams();
  const [filteredCleaners, setFilteredCleaners] = useState([]);
  const [postcode, setPostcode] = useState(searchParams.get('postcode') || '');
  const [minRating, setMinRating] = useState(Number(searchParams.get('minRating') || 0));
  const [bookingStatus, setBookingStatus] = useState(searchParams.get('bookingStatus') || 'all');
  const [serviceType, setServiceType] = useState(searchParams.get('serviceType') || '');
  const [loading, setLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const fetchFilteredCleaners = async () => {
      try {
        setLoading(true);
        const url = `/api/cleaners?postcode=${encodeURIComponent(postcode || '')}&minRating=${minRating}&bookingStatus=${encodeURIComponent(bookingStatus)}&serviceType=${encodeURIComponent(serviceType || '')}`;
        const res = await fetch(url, { credentials: 'include' });
        const json = await res.json();
        setFilteredCleaners(Array.isArray(json.cleaners) ? json.cleaners : []);
      } catch {
        setFilteredCleaners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredCleaners();
  }, [postcode, minRating, bookingStatus, serviceType]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('favourites') || '[]');
      setFavouriteIds(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
      setFavouriteIds([]);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setIsClient(data?.user?.type === 'client');
      } catch {}
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const toggleFavourite = async (id) => {
    const s = String(id);
    const next = favouriteIds.includes(s) ? favouriteIds.filter((x) => x !== s) : [...favouriteIds, s];
    setFavouriteIds(next);
    localStorage.setItem('favourites', JSON.stringify(next));

    if (isClient) {
      try {
        await fetch('/api/clients/toggle-favorite', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cleanerId: s }),
        });
      } catch {}
    }
  };

  const activeFilterCount = useMemo(
    () => [postcode, serviceType, minRating > 0 ? 'rating' : '', bookingStatus !== 'all' ? 'booking' : ''].filter(Boolean).length,
    [postcode, serviceType, minRating, bookingStatus]
  );

  return (
    <main className="site-shell">
      <PublicHeader ctaHref="/register/client" ctaLabel="Register" />

      <PageHero
        eyebrow="Compare cleaner listings"
        title="Find a cleaner that fits your area and schedule"
        description="Filter by postcode, service, rating, and availability to narrow things down quickly."
      />

      <section className="section-shell pb-8">
        <div className="surface-card p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Search filters</h2>
              <p className="mt-2 text-sm text-slate-600">Use the filters below to refine your cleaner results.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Postcode</label>
              <input
                type="text"
                placeholder="Enter postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Minimum rating</label>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="input">
                <option value={0}>Any rating</option>
                <option value={3}>3★ and above</option>
                <option value={4}>4★ and above</option>
                <option value={4.5}>4.5★ and above</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Booking status</label>
              <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="input">
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Service type</label>
              <input
                type="text"
                placeholder="For example oven cleaning"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell pb-14">
        {loading ? (
          <div className="surface-card p-12 text-center text-slate-500">Loading cleaners...</div>
        ) : filteredCleaners.length === 0 ? (
          <div className="empty-state">
            <h3 className="text-2xl font-semibold text-slate-900">No cleaners found</h3>
            <p className="mt-3 text-slate-600">Try widening your search or checking back soon as new cleaners join.</p>
            <div className="mt-6">
              <Link href="/" className="brand-button">Back to home</Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">Showing {filteredCleaners.length} cleaner{filteredCleaners.length === 1 ? '' : 's'}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCleaners.map((cleaner) => {
                const image = resolveCleanerImage(cleaner);
                const rating = cleaner.googleReviews?.rating ?? cleaner.rating;
                const ratingCount = cleaner.googleReviews?.count ?? cleaner.ratingCount;
                const cleanerId = String(cleaner._id);

                return (
                  <article key={cleanerId} className="surface-card overflow-hidden">
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      <img src={image} alt={cleaner.companyName || cleaner.realName || 'Cleaner'} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => toggleFavourite(cleanerId)}
                        className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-2 text-lg shadow-sm"
                        aria-label={favouriteIds.includes(cleanerId) ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        {favouriteIds.includes(cleanerId) ? '❤️' : '🤍'}
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {cleaner.isPremium ? <span className="status-badge bg-amber-100 text-amber-800">Premium</span> : null}
                        {cleaner.businessInsurance ? <span className="status-badge bg-emerald-100 text-emerald-800">Insured</span> : null}
                        {cleaner.dbsChecked ? <span className="status-badge bg-blue-100 text-blue-800">DBS checked</span> : null}
                      </div>

                      <h3 className="mt-4 text-xl font-semibold text-slate-900">{cleaner.companyName || cleaner.realName || 'Cleaner profile'}</h3>
                      <p className="mt-1 text-sm text-slate-500">{cleaner.address?.postcode || cleaner.postcode || 'Location available on profile'}</p>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                        {rating ? <span>⭐ {rating}{ratingCount ? ` (${ratingCount})` : ''}</span> : null}
                        {typeof cleaner.rates === 'number' ? <span>From £{cleaner.rates}/hour</span> : null}
                      </div>

                      {Array.isArray(cleaner.services) && cleaner.services.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {cleaner.services.slice(0, 4).map((service) => (
                            <span key={service} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link href={`/cleaners/${cleanerId}`} className="brand-button">
                          View profile
                        </Link>
                        <Link href={`/cleaners/${cleanerId}`} className="brand-button-secondary">
                          Request booking
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <PublicFooter />
    </main>
  );
}
