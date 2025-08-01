'use client';

import React from 'react'; 
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [postcode, setPostcode] = useState('');
  const [propertySize, setPropertySize] = useState('studio');
  const [cleaningType, setCleaningType] = useState('regular');
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [showPrice, setShowPrice] = useState(false);
  const [premiumCleaners, setPremiumCleaners] = useState([]);
  const [freeCleaners, setFreeCleaners] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);

  const { data, error, isLoading } = useSWR('/api/cleaners?bookingStatus=all', fetcher);

  // Load saved favourites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favourites');
    if (saved) {
      try {
        setFavouriteIds(JSON.parse(saved));
      } catch (e) {
        console.error('Could not parse favourites from localStorage:', e);
      }
    }
  }, []);

  // Set premium and free cleaners
  useEffect(() => {
    if (data?.cleaners) {
      const premium = data.cleaners.filter(c => c.isPremium === true).slice(0, 5);
      const free = data.cleaners.filter(c => c.isPremium !== true).slice(0, 5);
      setPremiumCleaners(premium);
      setFreeCleaners(free);
    }
  }, [data]);

  // Only run once on client side
  useEffect(() => {
    if (typeof window !== 'undefined') setMounted(true);
  }, []);

  // Booking handler
  const handleBookingRequest = (cleanerId) => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      router.push(`/login/clients?next=/cleaners/${cleanerId}/checkout`);
    } else {
      router.push(`/cleaners/${cleanerId}/checkout`);
    }
  };

  // Favourite toggle handler
  const handleToggleFavourite = (cleanerId) => {
    let updatedFavourites;

    if (favouriteIds.includes(cleanerId)) {
      updatedFavourites = favouriteIds.filter(id => id !== cleanerId);
    } else {
      updatedFavourites = [...favouriteIds, cleanerId];
    }

    setFavouriteIds(updatedFavourites);
    localStorage.setItem('favourites', JSON.stringify(updatedFavourites));
  };

  // Price chart and calculator
  const priceChart = {
    studio: { regular: 200, deep: 200, tenancy: 200 },
    '1-bed': { regular: 240, deep: 240, tenancy: 240 },
    '2-bed': { regular: 285, deep: 285, tenancy: 285 },
    '3-bed': { regular: 330, deep: 330, tenancy: 330 },
    '4-5-bed': { regular: 404, deep: 404, tenancy: 404 },
    '6+-bed': { regular: 450, deep: 450, tenancy: 450 },
  };

  const handleCalculatePrice = () => {
    const price = priceChart[propertySize][cleaningType];
    setEstimatedPrice(price);
    setShowPrice(true);
  };

  // Fisher-Yates shuffle (still usable if needed)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  if (!mounted) return null;


  return (
    <>
      <Head>
        <title>Compare House Cleaning Services Near You | Find Trusted Cleaners</title>
        <meta name="description" content="Compare domestic cleaners across the UK. Get instant quotes, find local cleaners, and book easily with Find Trusted Cleaners." />
      </Head>

      <main className="relative min-h-screen overflow-hidden text-gray-700">
        {/* Background with subtle overlay */}
        <div className="absolute inset-0 -z-10">
          <img src="/background.jpg" alt="Background" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-transparent to-teal-700/10"></div>
        </div>

        {/* Header with glass morphism */}
        <header className="sticky top-0 z-50 bg-gray-600 border-b border-gray-300 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 space-y-2 sm:space-y-0">
            <Link href="/" className="group">
              <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto transition-all duration-300 group-hover:scale-105" />
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

        {/* Hero Section with enhanced glass morphism */}
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

                <button onClick={handleCalculatePrice} className="btn-primary">
                  Calculate Price
                </button>
              </div>

              {showPrice && estimatedPrice && (
                <div className="mt-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg animate-slide-up">
                  <p className="text-2xl font-bold text-teal-800 mb-2">Estimated Price: £{estimatedPrice}</p>
                  <p className="text-sm text-gray-600 mb-1">Remember these are ball park averages. To get a better idea of typical cost of cleaning services, please search your postcode.</p>
                  <p className="text-sm text-gray-600">Average hourly rate: £22 - £27</p>
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
              <div className="text-center text-white">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="mt-2">Loading featured cleaners...</p>
              </div>
            ) : premiumCleaners.length === 0 ? (
              <p className="text-center text-white text-lg">No premium cleaners available at this time.</p>
            ) : (
              <div className="flex overflow-x-auto gap-6 pb-4 px-2 scrollbar-hide">
                {premiumCleaners.map((cleaner) => (
                  <CleanerCard 
  key={cleaner._id} 
  cleaner={cleaner} 
  handleBookingRequest={handleBookingRequest} 
  isPremium 
  isFavourite={false} 
  onToggleFavourite={handleToggleFavourite}
/>

                ))}
              </div>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-6 py-12">
          <div className="glass-card p-8 sm:p-12">
            <h2 className="text-3xl font-bold mb-12 text-center text-teal-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="step-circle group-hover:scale-110 transition-transform duration-300">1</div>
                <h3 className="text-xl font-semibold mb-3 text-teal-800">Search</h3>
                <p className="text-gray-700">Enter your postcode to find trusted cleaners in your area.</p>
              </div>
              <div className="text-center group">
                <div className="step-circle group-hover:scale-110 transition-transform duration-300">2</div>
                <h3 className="text-xl font-semibold mb-3 text-teal-800">Compare</h3>
                <p className="text-gray-700">Review cleaner profiles, availability, and pricing to choose the best fit.</p>
              </div>
              <div className="text-center group">
                <div className="step-circle group-hover:scale-110 transition-transform duration-300">3</div>
                <h3 className="text-xl font-semibold mb-3 text-teal-800">Book</h3>
                <p className="text-gray-700">Request your preferred cleaner and confirm your booking online.</p>
              </div>
            </div>

            {/* Registration Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12">
              <Link href="/register/cleaners" className="btn-success">
                Register as a Cleaner
              </Link>
              <Link href="/register/clients" className="btn-info">
                Register as a Client
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="container mx-auto px-6 py-12">
          <div className="glass-card p-8 sm:p-12">
            <h2 className="text-3xl font-bold mb-10 text-center text-teal-800">Why Choose Us?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="feature-card">
                <div className="feature-icon">✓</div>
                <h3 className="text-xl font-semibold mb-3">Verified Cleaners</h3>
                <p>All cleaners are independently verified and vetted to ensure trust and reliability.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h3 className="text-xl font-semibold mb-3">Transparent Availability</h3>
                <p>View cleaner availability in real-time to book at your convenience.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💳</div>
                <h3 className="text-xl font-semibold mb-3">No Subscriptions</h3>
                <p>Enjoy a pay-per-booking model with no hidden fees or ongoing subscriptions.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⭐</div>
                <h3 className="text-xl font-semibold mb-3">Real Customer Reviews</h3>
                <p>Read verified reviews from real customers to make confident decisions.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💷</div>
                <h3 className="text-xl font-semibold mb-3">Simple, Transparent Pricing</h3>
                <p>Our pricing is clear, simple, and easy to understand. No surprises.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Free Cleaners Section */}
        <section className="px-6 py-12">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-grey drop-shadow-lg">
              Free Listed Cleaners
            </h2>

            {isLoading ? (
              <div className="text-center text-white">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="mt-2">Loading cleaners...</p>
              </div>
            ) : freeCleaners.length === 0 ? (
              <p className="text-center text-white text-lg">No free listed cleaners available at this time.</p>
            ) : (
              <div className="flex overflow-x-auto gap-6 pb-4 px-2 scrollbar-hide">
                {freeCleaners.map((cleaner) => (
                  <CleanerCard 
  key={cleaner._id} 
  cleaner={cleaner} 
  handleBookingRequest={handleBookingRequest} 
  isFavourite={false} 
  onToggleFavourite={handleToggleFavourite}
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
                onClick={() => { localStorage.removeItem('cookie_consent'); window.location.reload(); }} 
                className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
              >
                Cookie Settings
              </Link>

              <p className="mb-4 text-lg">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

              <p className="text-sm opacity-90 max-w-4xl mx-auto">
                FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
                <Link href="/privacy-policy" className="underline hover:text-teal-200">Privacy Policy</Link>{' '} and{' '}
                <Link href="/cookie-policy" className="underline hover:text-teal-200">Cookie Policy</Link>{' '} for details on how we protect your data.
                You may <Link href="/contact" className="underline hover:text-teal-200">contact us</Link> at any time to manage your personal information.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Styles go inside the return */}
       <style jsx global>{`
        /* Modern Glass Morphism Styles */
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        /* Modern Input Styles */
        .modern-input {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(13, 148, 136, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 16px;
          transition: all 0.3s ease;
          outline: none;
        }

        .modern-input:focus {
          border-color: #0D9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
          transform: translateY(-1px);
        }

        .modern-select {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(13, 148, 136, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 16px;
          transition: all 0.3s ease;
          outline: none;
          cursor: pointer;
        }

        .modern-select:focus {
          border-color: #0D9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        /* Modern Button Styles */
        .btn-primary {
          background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(13, 148, 136, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(13, 148, 136, 0.4);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-success {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 14px 28px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn-success:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
        }

        .btn-info {
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 14px 28px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn-info:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
        }

        /* Step Circle */
        .step-circle {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin: 0 auto 16px;
          box-shadow: 0 4px 15px rgba(13, 148, 136, 0.3);
        }

        /* Feature Card */
        .feature-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        /* Navigation Links */
        .nav-link {
          color: white;
          text-decoration: none;
          position: relative;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-link:active {
          transform: scale(0.98);
        }

        /* Footer Links */
        .footer-link {
          color: white;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .footer-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        /* Animations */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        /* Scrollbar Hide */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Responsive Container */
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Active tap effect */
        .active-tap:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
}
function CleanerCard({ cleaner, handleBookingRequest, isPremium, isFavourite, onToggleFavourite }) {

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Debug: Log the cleaner object to see available properties
  console.log('Cleaner data:', cleaner);

  return (
    <div className="cleaner-card">
      {/* Favorite Toggle */}
    <div className="text-right mb-2">
  <button
    onClick={() => onToggleFavourite(cleaner._id)}
    className={`text-2xl transition-transform duration-200 ${
      isFavourite ? 'text-red-500' : 'text-gray-400'
    } hover:scale-110`}
    title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
  >
    {isFavourite ? '❤️' : '🤍'}
  </button>
</div>

      {/* Badges */}
      <div className="flex gap-2 mb-4">
        {isPremium && (
          <div className="premium-badge">
            <span className="text-xs font-semibold">Premium Cleaner</span>
          </div>
        )}
        {/* Check multiple possible insurance property names */}
        {(cleaner.businessInsurance || cleaner.isInsured || cleaner.hasInsurance || cleaner.business_insurance) && (
          <div className="insured-badge">
            <span className="text-xs font-semibold">✔ Insured</span>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="cleaner-image">
        <img
          src={typeof cleaner.image === 'string' && cleaner.image.trim() !== '' ? cleaner.image : '/default-avatar.png'}
          alt={cleaner.realName || 'Cleaner'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="cleaner-info">
        <h3 className="cleaner-name">{cleaner.realName}</h3>

        {/* Services */}
        {Array.isArray(cleaner.services) && cleaner.services.length > 0 && (
          <div className="mt-2">
            <h4 className="font-semibold text-teal-700 text-sm mb-1">Services Offered:</h4>
            <div className="flex flex-wrap gap-2">
              {cleaner.services.map((service, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
{(cleaner.rating || cleaner.googleReviewRating) ? (
  <div className="cleaner-rating">
    {cleaner.rating && (
      <p className="text-sm text-yellow-600">
        ⭐ {cleaner.rating} ({cleaner.reviewCount || 0}) from site users
      </p>
    )}
    {cleaner.googleReviewRating && cleaner.googleReviewCount && (
      <p className="text-sm text-yellow-600">
        ⭐ {cleaner.googleReviewRating} ({cleaner.googleReviewCount}) from Google
      </p>
    )}
  </div>
) : (
  <p className="cleaner-rating text-sm text-gray-600">⭐ Not rated yet</p>
)}


        {/* Rate */}
        <p className="cleaner-rate">
          💷 {cleaner.rates ? `£${cleaner.rates}/hr` : 'Rate not set'}
        </p>

        {/* Availability */}
        {isPremium && cleaner.availability && (
          <div className="availability-grid mt-4">
            <h4 className="font-semibold text-teal-700 mb-2 text-center">Availability</h4>
            <div className="grid grid-cols-[60px_repeat(13,1fr)] text-xs border border-gray-200 rounded overflow-hidden">
              <div className="bg-gray-100 p-1 font-bold text-center">Day</div>
              {Array.from({ length: 13 }, (_, i) => (
                <div key={`hour-head-${i}`} className="bg-gray-100 p-1 text-center">{7 + i}</div>
              ))}
              {daysOfWeek.map(day => {
                const slots = cleaner.availability[day] || {};
                return (
                  <React.Fragment key={day}>
                    <div className="bg-gray-50 p-1 font-medium text-center">{day.slice(0, 3)}</div>
                    {Array.from({ length: 13 }, (_, i) => {
                      const hour = (7 + i).toString();
                      const value = slots[hour];
                      const status = value === true ? 'available' : 'unavailable';
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`p-1 text-center ${
                            status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {status === 'available' ? '✅' : '❌'}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Button */}
        <div className="cleaner-actions mt-4">
          <Link href={`/cleaners/${cleaner._id}`} className="btn-request-booking">
            View Profile
          </Link>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .cleaner-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          min-width: 300px; /* Fixed width for consistent layout */
          max-width: 350px;
          flex: 0 0 auto; /* Prevent flex shrinking */
        }

        .cleaner-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .premium-badge {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .insured-badge {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .cleaner-image {
          width: 100%;
          height: 150px;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .cleaner-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .cleaner-card:hover .cleaner-image img {
          transform: scale(1.05);
        }

        .cleaner-info {
          text-align: left;
        }

        .cleaner-name {
          font-size: 18px;
          font-weight: 700;
          color: #0F766E;
          margin-bottom: 8px;
        }

        .cleaner-rating,
        .cleaner-rate {
          color: #4B5563;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .cleaner-actions {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        .btn-request-booking {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
          display: inline-block;
        }

        .btn-request-booking:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          color: white;
        }
      `}</style>
    </div>
  );
}