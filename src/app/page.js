'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';

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
  const [loading, setLoading] = useState(true);

  const priceChart = {
    studio: { regular: 200, deep: 200, tenancy: 200 },
    '1-bed': { regular: 240, deep: 240, tenancy: 240 },
    '2-bed': { regular: 285, deep: 285, tenancy: 285 },
    '3-bed': { regular: 330, deep: 330, tenancy: 330 },
    '4-5-bed': { regular: 404, deep: 404, tenancy: 404 },
    '6+-bed': { regular: 450, deep: 450, tenancy: 450 },
  };

  useEffect(() => {
    if (typeof window !== 'undefined') setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCleaners = async () => {
      try {
        const res = await fetch('/api/cleaners');
        const { cleaners } = await res.json();

        const premium = cleaners.filter(c => c.isPremium).slice(0, 5);
        const free = cleaners.filter(c => !c.isPremium).slice(0, 5);

        setPremiumCleaners(premium);
        setFreeCleaners(free);
      } catch (err) {
        console.error('Failed to fetch cleaners:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, []);

  const handleBookingRequest = (cleanerId) => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      router.push(`/login/clients?next=/cleaners/${cleanerId}/checkout`);
    } else {
      router.push(`/cleaners/${cleanerId}/checkout`);
    }
  };

  const handleCalculatePrice = () => {
    const price = priceChart[propertySize][cleaningType];
    setEstimatedPrice(price);
    setShowPrice(true);
  };

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Compare House Cleaning Services Near You | Find Trusted Cleaners</title>
        <meta name="description" content="Compare domestic cleaners across the UK. Get instant quotes, find local cleaners, and book easily with Find Trusted Cleaners." />
      </Head>

      <main className="relative min-h-screen overflow-hidden text-gray-700">
        <img src="/background.jpg" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-40 -z-10" />

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-teal-600 bg-opacity-90 shadow text-white space-y-2 sm:space-y-0">
          <Link href="/"><img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" /></Link>
          <nav className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm font-medium">
            <Link href="/cleaners" className="active-tap">Find a Cleaner</Link>
            <Link href="/register/cleaners" className="active-tap">List Yourself</Link>
            <Link href="/how-it-works" className="active-tap">How It Works</Link>
            <Link href="/login" className="active-tap">Login</Link>
            <Link href="/blog" className="active-tap">Blog</Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="text-center py-12 bg-white/70 backdrop-blur rounded-xl mx-4 my-6">
          <h1 className="text-4xl font-bold text-[#0D9488] mb-4">Compare House Cleaning Services Near You</h1>
          <p className="text-base text-gray-700 mb-6">Real cleaners. Local prices. Book quickly and easily.</p>

          {/* Postcode Search */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Search Cleaners by Postcode</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Enter Postcode" className="p-2 border rounded w-full sm:w-auto" />
              <button onClick={() => router.push(`/cleaners?postcode=${postcode}`)} className="bg-[#0D9488] text-white px-6 py-2 rounded shadow hover:bg-teal-700 w-full sm:w-auto active-tap">Search Cleaners</button>
            </div>
          </div>

          {/* Price Calculator */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Calculate Estimated Cleaning Cost</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <select value={propertySize} onChange={(e) => setPropertySize(e.target.value)} className="p-2 border rounded w-full sm:w-auto">
                <option value="studio">Studio</option>
                <option value="1-bed">1 Bed</option>
                <option value="2-bed">2 Bed</option>
                <option value="3-bed">3 Bed</option>
                <option value="4-5-bed">4 or 5 Bed</option>
                <option value="6+-bed">6 or More Bed</option>
              </select>

              <select value={cleaningType} onChange={(e) => setCleaningType(e.target.value)} className="p-2 border rounded w-full sm:w-auto">
                <option value="regular">Regular Clean</option>
                <option value="deep">Deep Clean</option>
                <option value="tenancy">End of Tenancy</option>
              </select>

              <button onClick={handleCalculatePrice} className="bg-[#0D9488] text-white px-6 py-2 rounded shadow hover:bg-teal-700 w-full sm:w-auto active-tap">Calculate Price</button>
            </div>

            {showPrice && estimatedPrice && (
              <div className="mt-4 text-lg text-gray-800">
                <p>Estimated Price: £{estimatedPrice}</p>
                <p className="text-sm text-gray-600 mt-2">Remember these are ball park averages. To get a better idea of typical cost of cleaning services, please search your postcode.</p>
                <p className="text-sm text-gray-600 mt-1">Average hourly rate: £22 - £27</p>
              </div>
            )}
          </div>
        </section>

        {/* Premium Cleaners */}
        <section className="px-6 py-10">
          <h2 className="text-2xl font-semibold mb-4 text-center text-white drop-shadow">Featured Premium Cleaners</h2>

          {loading ? (
            <p className="text-center text-white">Loading featured cleaners...</p>
          ) : premiumCleaners.length === 0 ? (
            <p className="text-center text-white">No premium cleaners available at this time.</p>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 px-2">
              {premiumCleaners.map((cleaner) => (
                <CleanerCard key={cleaner._id} cleaner={cleaner} handleBookingRequest={handleBookingRequest} isPremium />
              ))}
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section className="px-6 py-10 bg-white/80 backdrop-blur-md rounded-xl mx-4 my-6">
          <h2 className="text-2xl font-semibold mb-8 text-center text-[#0D9488]">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-lg">1</div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p>Enter your postcode to find trusted cleaners in your area.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-lg">2</div>
              <h3 className="text-xl font-semibold mb-2">Compare</h3>
              <p>Review cleaner profiles, availability, and pricing to choose the best fit.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-lg">3</div>
              <h3 className="text-xl font-semibold mb-2">Book</h3>
              <p>Request your preferred cleaner and confirm your booking online.</p>
            </div>
          </div>

          {/* Registration Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-10">
            <Link href="/register/cleaners" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg text-center w-full sm:w-auto active-tap transition-transform transform hover:scale-105">
              Register as a Cleaner
            </Link>
            <Link href="/register/clients" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg text-center w-full sm:w-auto active-tap transition-transform transform hover:scale-105">
              Register as a Client
            </Link>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="px-6 py-10 bg-white/80 backdrop-blur-md rounded-xl mx-4 my-6">
          <h2 className="text-2xl font-semibold mb-6 text-center text-[#0D9488]">Why Choose Us?</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="p-6 bg-[#0D9488] text-white rounded-lg shadow-lg flex flex-col items-center max-w-xs">
              <div className="w-16 h-16 bg-white text-[#0D9488] rounded-full flex items-center justify-center text-2xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Verified Cleaners</h3>
              <p className="text-center">All cleaners are independently verified and vetted to ensure trust and reliability.</p>
            </div>
            <div className="p-6 bg-[#0D9488] text-white rounded-lg shadow-lg flex flex-col items-center max-w-xs">
              <div className="w-16 h-16 bg-white text-[#0D9488] rounded-full flex items-center justify-center text-2xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Transparent Availability</h3>
              <p className="text-center">View cleaner availability in real-time to book at your convenience.</p>
            </div>
            <div className="p-6 bg-[#0D9488] text-white rounded-lg shadow-lg flex flex-col items-center max-w-xs">
              <div className="w-16 h-16 bg-white text-[#0D9488] rounded-full flex items-center justify-center text-2xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">No Subscriptions</h3>
              <p className="text-center">Enjoy a pay-per-booking model with no hidden fees or ongoing subscriptions.</p>
            </div>
            <div className="p-6 bg-[#0D9488] text-white rounded-lg shadow-lg flex flex-col items-center max-w-xs">
              <div className="w-16 h-16 bg-white text-[#0D9488] rounded-full flex items-center justify-center text-2xl mb-4">4</div>
              <h3 className="text-xl font-semibold mb-2">Real Customer Reviews</h3>
              <p className="text-center">Read verified reviews from real customers to make confident decisions.</p>
            </div>
            <div className="p-6 bg-[#0D9488] text-white rounded-lg shadow-lg flex flex-col items-center max-w-xs">
              <div className="w-16 h-16 bg-white text-[#0D9488] rounded-full flex items-center justify-center text-2xl mb-4">5</div>
              <h3 className="text-xl font-semibold mb-2">Simple, Transparent Pricing</h3>
              <p className="text-center">Our pricing is clear, simple, and easy to understand. No surprises.</p>
            </div>
          </div>
        </section>

        {/* Free Cleaners Section */}
        <section className="px-6 py-10">
          <h2 className="text-2xl font-semibold mb-4 text-center text-white drop-shadow">Free Listed Cleaners</h2>

          {loading ? (
            <p className="text-center text-white">Loading cleaners...</p>
          ) : freeCleaners.length === 0 ? (
            <p className="text-center text-white">No free listed cleaners available at this time.</p>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 px-2">
              {freeCleaners.map((cleaner) => (
                <CleanerCard key={cleaner._id} cleaner={cleaner} handleBookingRequest={handleBookingRequest} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="bg-teal-600 border-t py-6 px-6 text-center text-sm text-white">
          <nav className="flex flex-wrap justify-center gap-4 mb-2">
            <Link href="/about" className="active-tap">About Us</Link>
            <Link href="/terms" className="active-tap">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="active-tap">Privacy Policy</Link>
            <Link href="/cookie-policy" className="active-tap">Cookie Policy</Link>
            <Link href="/contact" className="active-tap">Contact</Link>
            <Link href="/faq" className="active-tap">FAQs</Link>
            <Link href="/sitemap" className="active-tap">Site Map</Link>
          </nav>

          <Link href="#" onClick={() => { localStorage.removeItem('cookie_consent'); window.location.reload(); }} className="underline active-tap">Cookie Settings</Link>

          <p className="mb-2">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

          <p className="text-xs">
            FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
            <Link href="/privacy-policy" className="underline active-tap">Privacy Policy</Link>{' '} and{' '}
            <Link href="/cookie-policy" className="underline active-tap">Cookie Policy</Link>{' '} for details on how we protect your data.
            You may <Link href="/contact" className="underline active-tap">contact us</Link> at any time to manage your personal information.
          </p>
        </footer>
      </main>

      <style jsx global>{`
        .active-tap:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
}

function CleanerCard({ cleaner, handleBookingRequest, isPremium }) {
  return (
    <div className="min-w-[250px] border rounded shadow p-4 bg-white bg-opacity-90 flex-shrink-0">
      {isPremium && <span className="block mb-2 text-xs bg-yellow-400 text-white px-2 py-1 rounded">Premium Cleaner</span>}
      <img src={cleaner.image || '/profile-placeholder.png'} alt={cleaner.realName} className="w-full h-32 object-cover rounded mb-2" />
      <p className="font-bold">{cleaner.realName}</p>
      <p>⭐ {cleaner.rating || 'Not rated yet'}</p>
      <p>💷 {cleaner.rate ? `£${cleaner.rate}/hr` : 'Rate not set'}</p>

      {(cleaner.googleReviewUrl || cleaner.facebookReviewUrl) && (
        <div className="mt-2 flex flex-col gap-1 text-sm">
          {cleaner.googleReviewUrl && (
            <a href={cleaner.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline active-tap">
              Google Reviews
            </a>
          )}
          {cleaner.facebookReviewUrl && (
            <a href={cleaner.facebookReviewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline active-tap">
              Facebook Reviews
            </a>
          )}
        </div>
      )}

      <div className="mt-2 space-y-1">
        <Link href={`/cleaners/${cleaner._id}`} className="block w-full text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700 active-tap">View Profile</Link>
        <button onClick={() => handleBookingRequest(cleaner._id)} className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 active-tap">Request Booking</button>
      </div>
    </div>
  );
}
