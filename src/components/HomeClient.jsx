// src/components/HomeClient.jsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { injectPendingFromPurchases } from '@/lib/availability';

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json());

// Public APIs
const CLEANERS_API = '/api/public-cleaners';
const PURCHASES_API = (id) => `/api/public/purchases/cleaners/${id}`;

// Hours & days for the mini-grid
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i));
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/** Safely hydrate a cleaner’s availability with pending/booked spans from purchases. */
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
          availabilityMerged: injectPendingFromPurchases?.(c.availability || {}, purchases) ?? (c.availability || {}),
        };
      } catch {
        return { ...c, availabilityMerged: c.availability || {} };
      }
    })
  );
}

export default function HomeClient() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR(CLEANERS_API, fetcher);

  const [mounted, setMounted] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [propertySize, setPropertySize] = useState('studio');
  const [cleaningType, setCleaningType] = useState('regular');
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [showPrice, setShowPrice] = useState(false);

  const [premiumCleaners, setPremiumCleaners] = useState([]);
  const [freeCleaners, setFreeCleaners] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);

  useEffect(() => setMounted(true), []);

  // Load favourites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favourites');
      if (saved) {
        const arr = JSON.parse(saved);
        setFavouriteIds(Array.isArray(arr) ? arr.map(String) : []);
      }
    } catch {}
  }, []);

  // Split premium vs free and hydrate with purchases
  useEffect(() => {
    if (!data?.success || !Array.isArray(data.cleaners)) return;
    const premium = data.cleaners.filter((c) => c.isPremium).slice(0, 5);
    const free = data.cleaners.filter((c) => !c.isPremium).slice(0, 5);

    (async () => {
      const [p, f] = await Promise.all([
        hydrateCleanersWithPurchases(premium),
        hydrateCleanersWithPurchases(free),
      ]);
      setPremiumCleaners(p);
      setFreeCleaners(f);
    })();
  }, [data?.success]);

  const handleBookingRequest = (cleanerId) => {
    const clientId = typeof window !== 'undefined' ? localStorage.getItem('clientId') : null;
    if (!clientId) {
      router.push(`/login/clients?next=/cleaners/${cleanerId}`);
    } else {
      router.push(`/cleaners/${cleanerId}`);
    }
  };

  const handleToggleFavourite = (cleanerId) => {
    const id = String(cleanerId);
    const updated = favouriteIds.includes(id)
      ? favouriteIds.filter((x) => x !== id)
      : [...favouriteIds, id];
    setFavouriteIds(updated);
    try {
      localStorage.setItem('favourites', JSON.stringify(updated));
    } catch {}
  };

  // Simple price chart
  const priceChart = {
    studio: { regular: 200, deep: 200, tenancy: 200 },
    '1-bed': { regular: 240, deep: 240, tenancy: 240 },
    '2-bed': { regular: 285, deep: 285, tenancy: 285 },
    '3-bed': { regular: 330, deep: 330, tenancy: 330 },
    '4-5-bed': { regular: 404, deep: 404, tenancy: 404 },
    '6+-bed': { regular: 450, deep: 450, tenancy: 450 },
  };
  const handleCalculatePrice = () => {
    setEstimatedPrice(priceChart[propertySize][cleaningType]);
    setShowPrice(true);
  };

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-hidden text-gray-700">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img src="/background.jpg" alt="Background" className="w-full h-full object-contain" />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-transparent to-teal-700/10"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-600 border-b border-gray-300 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 space-y-2 sm:space-y-0">
          <Link href="/" className="group">
            <img
              src="/findtrusted-logo.png"
              alt="Logo"
              className="w-32 h-auto transition-all duration-300 group-hover:scale-105"
            />
          </Link>
          <nav className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm font-medium">
            <Link href="/cleaners" className="nav-link">Find a Cleaner</Link>
            <Link href="/register/cleaners" className="nav-link">List Yourself</Link>
            <Link href="/how-it-works" className="nav-link">How It Works</Link>
            <Link href="/login" className="nav-link">Login</Link>
            <Link href="/blog" className="nav-link">Blog</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-16">
        <div className="glass-card text-center p-8 sm:p-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6 leading-tight">
            Compare House Cleaning Services Near You
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Real cleaners. Local prices. Book quickly and easily.
          </p>

          {/* Postcode Search */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-teal-800">Search Cleaners by Postcode</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter Postcode"
                className="modern-input flex-1"
              />
              <button
                onClick={() => router.push(`/cleaners?postcode=${postcode}`)}
                className="btn-primary"
              >
                Search Cleaners
              </button>
            </div>
          </div>

          {/* Price Calculator */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-teal-800">Calculate Estimated Cleaning Cost</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
              <select value={propertySize} onChange={(e) => setPropertySize(e.target.value)} className="modern-select">
                <option value="studio">Studio</option>
                <option value="1-bed">1 Bed</option>
                <option value="2-bed">2 Bed</option>
                <option value="3-bed">3 Bed</option>
                <option value="4-5-bed">4 or 5 Bed</option>
                <option value="6+-bed">6 or More Bed</option>
              </select>

              <select value={cleaningType} onChange={(e) => setCleaningType(e.target.value)} className="modern-select">
                <option value="regular">Regular Clean</option>
                <option value="deep">Deep Clean</option>
                <option value="tenancy">End of Tenancy</option>
              </select>

              <button onClick={handleCalculatePrice} className="btn-primary">Calculate Price</button>
            </div>

            {showPrice && estimatedPrice && (
              <div className="mt-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg animate-slide-up">
                <p className="text-2xl font-bold text-teal-800 mb-2">Estimated Price: £{estimatedPrice}</p>
                <p className="text-sm text-gray-600 mb-1">
                  These are ball-park averages. For accurate pricing, search your postcode.
                </p>
                <p className="text-sm text-gray-600">Average hourly rate: £22–£27</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Premium Cleaners */}
      <section className="px-6 py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-black drop-shadow-lg">
            Featured Premium Cleaners
          </h2>

          {isLoading ? (
            <LoadingRow text="Loading featured cleaners..." />
          ) : (premiumCleaners || []).length === 0 ? (
            <p className="text-center text-white text-lg">No premium cleaners available at this time.</p>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 px-2 scrollbar-hide">
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
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 py-12">
        <div className="glass-card p-8 sm:p-12">
          <h2 className="text-3xl font-bold mb-12 text-center text-teal-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step n="1" title="Search" desc="Enter your postcode to find trusted cleaners in your area." />
            <Step n="2" title="Compare" desc="Review cleaner profiles, availability, and pricing to choose the best fit." />
            <Step n="3" title="Book" desc="Request your preferred cleaner and confirm your booking online." />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12">
            <Link href="/register/cleaners" className="btn-success">Register as a Cleaner</Link>
            <Link href="/register/client" className="btn-info">Register as a Client</Link>
          </div>
        </div>
      </section>

      {/* Free Cleaners */}
      <section className="px-6 py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-grey drop-shadow-lg">Free Listed Cleaners</h2>

          {isLoading ? (
            <LoadingRow text="Loading cleaners..." />
          ) : (freeCleaners || []).length === 0 ? (
            <p className="text-center text-white text-lg">No free listed cleaners available at this time.</p>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 px-2 scrollbar-hide">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-teal-700 to-teal-800 py-8 px-6 text-white">
        <div className="container mx-auto">
          <nav className="flex flex-wrap justify-center gap-6 mb-4">
            <Link href="/about" className="footer-link">About Us</Link>
            <Link href="/terms" className="footer-link">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="footer-link">Privacy Policy</Link>
            <Link href="/cookie-policy" className="footer-link">Cookie Policy</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
            <Link href="/faq" className="footer-link">FAQs</Link>
            <Link href="/sitemap" className="footer-link">Site Map</Link>
          </nav>

          <div className="text-center">
            <Link
              href="#"
              onClick={() => {
                localStorage.removeItem('cookie_consent');
                window.location.reload();
              }}
              className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
            >
              Cookie Settings
            </Link>

            <p className="mb-4 text-lg">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

            <p className="text-sm opacity-90 max-w-4xl mx-auto">
              FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
              <Link href="/privacy-policy" className="underline hover:text-teal-200">Privacy Policy</Link>{' '}and{' '}
              <Link href="/cookie-policy" className="underline hover:text-teal-200">Cookie Policy</Link>{' '}for details.
              You may <Link href="/contact" className="underline hover:text-teal-200">contact us</Link> to manage your data.
            </p>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style jsx global>{`
        .glass-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
        .modern-input, .modern-select { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);
          border: 1px solid rgba(13,148,136,0.3); border-radius: 12px; padding: 12px 16px; font-size: 16px; transition: all .3s; outline: none; }
        .modern-input:focus, .modern-select:focus { border-color: #0D9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .btn-primary { background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); color: white; border: none;
          border-radius: 12px; padding: 12px 24px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all .3s;
          box-shadow: 0 4px 15px rgba(13,148,136,0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(13,148,136,0.4); }
        .btn-success, .btn-info { color: white; border: none; border-radius: 50px; padding: 14px 28px; font-size: 18px; font-weight: 600;
          cursor: pointer; transition: all .3s; text-decoration: none; display: inline-block; text-align: center; }
        .btn-success { background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 15px rgba(5,150,105,0.3); }
        .btn-success:hover { transform: translateY(-2px) scale(1.05); box-shadow: 0 8px 25px rgba(5,150,105,0.4); }
        .btn-info { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); box-shadow: 0 4px 15px rgba(37,99,235,0.3); }
        .btn-info:hover { transform: translateY(-2px) scale(1.05); box-shadow: 0 8px 25px rgba(37,99,235,0.4); }
        .step-circle { width: 64px; height: 64px; background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
          color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;
          margin: 0 auto 16px; box-shadow: 0 4px 15px rgba(13,148,136,0.3); }
        .feature-card { background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3);
          border-radius: 16px; padding: 24px; text-align: center; transition: all .3s; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav-link { color: white; text-decoration: none; position: relative; padding: 8px 16px; border-radius: 8px; transition: all .3s; font-weight: 500; }
        .nav-link:hover { background: rgba(255,255,255,0.1); color: white; }
        .footer-link { color: white; text-decoration: none; padding: 8px 12px; border-radius: 6px; transition: all .3s; }
        .footer-link:hover { background: rgba(255,255,255,0.1); color: white; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in .8s ease-out; }
        .animate-slide-up { animation: slide-up .5s ease-out; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .container { max-width: 1200px; margin: 0 auto; }
        .active-tap:active { transform: scale(0.98); }
      `}</style>
    </main>
  );
}

/* ---------- Subcomponents ---------- */

function LoadingRow({ text }) {
  return (
    <div className="text-center text-white">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <p className="mt-2">{text}</p>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="text-center group">
      <div className="step-circle group-hover:scale-110 transition-transform duration-300">{n}</div>
      <h3 className="text-xl font-semibold mb-3 text-teal-800">{title}</h3>
      <p className="text-gray-700">{desc}</p>
    </div>
  );
}

function CleanerCard({ cleaner, handleBookingRequest, isPremium, isFavourite, onToggleFavourite }) {
  const availability = cleaner.availabilityMerged || cleaner.availability || {};

  return (
    <div className="cleaner-card">
      {/* Favourite Toggle */}
      <div className="text-right mb-2">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavourite?.(cleaner._id); }}
          className={`text-2xl transition-transform duration-200 ${isFavourite ? 'text-red-500' : 'text-gray-400'} hover:scale-110`}
          aria-pressed={!!isFavourite}
          title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          {isFavourite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4">
        {isPremium && <div className="premium-badge"><span className="text-xs font-semibold">Premium Cleaner</span></div>}
        {cleaner.businessInsurance && <div className="insured-badge"><span className="text-xs font-semibold">✔ Insured</span></div>}
        {cleaner.dbsChecked && <div className="dbs-badge"><span className="text-xs font-semibold">✔ DBS Checked</span></div>}
      </div>

      {/* Image */}
      <div className="cleaner-image">
        <img
          src={typeof cleaner.image === 'string' && cleaner.image.trim() !== '' ? cleaner.image : '/default-avatar.png'}
          alt={cleaner.companyName || cleaner.realName || 'Cleaner'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="cleaner-info">
        <h3 className="cleaner-name">{cleaner.companyName || cleaner.realName}</h3>

        {/* Services */}
        {Array.isArray(cleaner.services) && cleaner.services.length > 0 && (
          <div className="mt-2">
            <h4 className="font-semibold text-teal-700 text-sm mb-1">Services Offered:</h4>
            <div className="flex flex-wrap gap-2">
              {cleaner.services.map((service, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        {cleaner.googleReviews?.rating ? (
          <p className="cleaner-rating text-sm text-yellow-600">⭐ {cleaner.googleReviews.rating} ({cleaner.googleReviews.count || 0}) on Google</p>
        ) : cleaner.rating ? (
          <p className="cleaner-rating text-sm text-yellow-600">⭐ {cleaner.rating} ({cleaner.reviewCount || 0}) from site users</p>
        ) : (
          <p className="cleaner-rating text-sm text-gray-600">⭐ Not rated yet</p>
        )}

        {/* Rate */}
        <p className="cleaner-rate">💷 {typeof cleaner.rates === 'number' ? `£${cleaner.rates}/hr` : 'Rate not set'}</p>

        {/* Availability mini-grid (only for premium) */}
        {isPremium && (
          <div className="availability-grid mt-4">
            <h4 className="font-semibold text-teal-700 mb-2 text-center">Availability</h4>
            <div className="grid grid-cols-[60px_repeat(13,1fr)] text-xs border border-gray-200 rounded overflow-hidden">
              <div className="bg-gray-100 p-1 font-bold text-center">Day</div>
              {HOURS.map((h) => (
                <div key={`head-${h}`} className="bg-gray-100 p-1 text-center">{h}</div>
              ))}
              {DAYS.map((day) => {
                const row = availability?.[day] || {};
                return (
                  <React.Fragment key={day}>
                    <div className="bg-gray-50 p-1 font-medium text-center">{day.slice(0,3)}</div>
                    {HOURS.map((h) => {
                      const v = row?.[h];
                      const statusVal = typeof v === 'object' ? v?.status : v;
                      let status = 'blocked';
                      if (statusVal === true || statusVal === 'available') status = 'available';
                      else if (statusVal === 'pending' || statusVal === 'pending_approval') status = 'pending';
                      else if (statusVal === 'booked') status = 'blocked';

                      const cls =
                        status === 'available' ? 'bg-green-100 text-green-800'
                        : status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800';

                      return (
                        <div key={`${day}-${h}`} className={`p-1 text-center ${cls}`} title={status}>
                          {status === 'available' ? '✅' : status === 'pending' ? '⏳' : '❌'}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="cleaner-actions mt-4 flex justify-center gap-2">
          <Link href={`/cleaners/${cleaner._id}`} className="btn-request-booking">View Profile</Link>
          <button onClick={() => handleBookingRequest?.(cleaner._id)} className="btn-request-booking active-tap">
            Request Booking
          </button>
        </div>
      </div>

      {/* Card styles */}
      <style jsx>{`
        .cleaner-card { background: rgba(255,255,255,0.95); border: 1px solid rgba(255,255,255,0.3); border-radius: 16px;
          padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: all .3s; min-width: 300px; max-width: 350px; flex: 0 0 auto; }
        .cleaner-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .premium-badge { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 4px 12px; border-radius: 20px; display: inline-block; box-shadow: 0 2px 8px rgba(245,158,11,0.3); }
        .insured-badge { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 4px 12px; border-radius: 20px; display: inline-block; box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
        .dbs-badge { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; padding: 4px 12px; border-radius: 20px; display: inline-block; box-shadow: 0 2px 8px rgba(37,99,235,0.3); }
        .cleaner-image { width: 100%; height: 150px; border-radius: 12px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .cleaner-info { text-align: left; }
        .cleaner-name { font-size: 18px; font-weight: 700; color: #0F766E; margin-bottom: 8px; }
        .cleaner-rating, .cleaner-rate { color: #4B5563; margin-bottom: 4px; font-size: 14px; }
        .btn-request-booking { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 12px 14px; border-radius: 8px;
          font-size: 14px; font-weight: 600; text-decoration: none; transition: all .3s; box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
        .btn-request-booking:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.4); color: white; }
      `}</style>
    </div>
  );
}
