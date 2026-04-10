'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CleanerCard from '@/components/CleanerCard';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

export default function FindCleanerPage() {
  const [filteredCleaners, setFilteredCleaners] = useState([]);
  const [postcode, setPostcode] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [bookingStatus, setBookingStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState('');
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
        const data = await res.json().catch(() => ({}));
        if (!ignore) setIsClient(data?.user?.type === 'client');
      } catch {}
    })();
    return () => { ignore = true; };
  }, []);

  const toggleFavourite = async (id) => {
    const s = String(id);
    const next = favouriteIds.includes(s) ? favouriteIds.filter((x) => x !== s) : [...favouriteIds, s];
    setFavouriteIds(next);
    localStorage.setItem('favourites', JSON.stringify(next));
    if (isClient) {
      try {
        await fetch('/api/clients/toggle-favorite', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cleanerId: s })
        });
      } catch {}
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <PageHero
        eyebrow="Search cleaner profiles"
        title="Browse trusted cleaners"
        description="Filter by postcode, service, rating, and booking status to find the right cleaner faster."
        actions={<Link href="/register/client" className="ftc-button-primary">Register as a client</Link>}
      />

      <section className="site-section py-8">
        <div className="surface-card p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Postcode</label>
              <input type="text" placeholder="Enter postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="ftc-input" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Service</label>
              <input type="text" placeholder="For example oven cleaning" value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="ftc-input" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Minimum rating</label>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="ftc-select">
                <option value={0}>Any rating</option>
                <option value={3}>3+ stars</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Booking status</label>
              <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="ftc-select">
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="booked">Booked</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section pb-12">
        {loading ? (
          <div className="surface-card p-10 text-slate-600">Loading cleaners…</div>
        ) : filteredCleaners.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900">No cleaners found</h2>
            <p className="mt-2 text-slate-600">Try a broader search or check back as more cleaners join the platform.</p>
            <div className="mt-6">
              <Link href="/register/cleaners" className="ftc-button-secondary">List your business</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">Showing {filteredCleaners.length} cleaner profile{filteredCleaners.length === 1 ? '' : 's'}.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCleaners.map((cleaner) => (
                <CleanerCard
                  key={cleaner._id}
                  cleaner={cleaner}
                  isPremium={cleaner.isPremium}
                  isFavourite={favouriteIds.includes(String(cleaner._id))}
                  onToggleFavourite={toggleFavourite}
                />
              ))}
            </div>
          </>
        )}
      </section>
      <PublicFooter />
    </main>
  );
}
