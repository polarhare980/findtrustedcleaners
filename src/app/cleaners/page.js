'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FindCleanerPage() {
  const [filteredCleaners, setFilteredCleaners] = useState([]);
  const [postcode, setPostcode] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [bookingStatus, setBookingStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState('');


  useEffect(() => {
    const fetchFilteredCleaners = async () => {
      try {
        setLoading(true);
        const url = `/api/cleaners?postcode=${postcode}&minRating=${minRating}&bookingStatus=${bookingStatus}&serviceType=${encodeURIComponent(serviceType)}`;
        const res = await fetch(url);
        const { cleaners } = await res.json();
        setFilteredCleaners(cleaners);
      } catch (err) {
        console.error('Error fetching cleaners:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredCleaners();
  }, [postcode, minRating, bookingStatus]);

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
      <div className="w-12 h-12 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin"></div>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-teal-800 mb-2">No Cleaners Found</h3>
      <p className="text-gray-600 mb-2">No cleaners found matching your search criteria.</p>
      <p className="text-gray-600 mb-6">Please check back soon — new cleaners are registering all the time!</p>
      <Link
        href="/"
        className="inline-block bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ease-in-out font-medium"
      >
        Back to Home
      </Link>
    </motion.div>
  );

  return (
    <main className="min-h-screen relative">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-teal-800/15 to-teal-700/10"></div>
      
      {/* Background image */}
      <img
        src="/background.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover -z-10 opacity-20"
      />

      {/* Glass morphism header */}
      <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:scale-105 transition-transform duration-300">
              <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
            </Link>
            <nav className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/cleaners" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">
                Find Cleaners
              </Link>
              <Link href="/register/cleaners" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">
                Register Cleaner
              </Link>
              <Link href="/login" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-4">
              Find Your Perfect Cleaner 🧹
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
              Discover trusted, verified cleaners in your area. Filter by location, rating, and availability.
            </p>
            <Link
              href="/register/client"
              className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 ease-in-out font-medium"
            >
              Register as a Client
            </Link>
          </motion.div>

          {/* Search filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-teal-800 mb-6 text-center">Search Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter postcode..."
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full p-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all duration-300"
                />
              </div>
              
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Minimum Rating
  </label>
  <select
    value={minRating}
    onChange={(e) => setMinRating(Number(e.target.value))}
    className="w-full p-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all duration-300"
  >
    <option value={0}>Any Rating</option>
    <option value={3}>3★ & above</option>
    <option value={4}>4★ & above</option>
    <option value={5}>5★ only</option>
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Availability
  </label>
  <select
    value={bookingStatus}
    onChange={(e) => setBookingStatus(e.target.value)}
    className="w-full p-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all duration-300"
  >
    <option value="all">All Statuses</option>
    <option value="available">Available</option>
    <option value="pending">Pending</option>
    <option value="booked">Booked</option>
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Service Type
  </label>
  <select
    value={serviceType}
    onChange={(e) => setServiceType(e.target.value)}
    className="w-full p-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all duration-300"
  >
    <option value="">All Services</option>
    <option value="Window Cleaning">Window Cleaning</option>
    <option value="Bin Cleaning">Bin Cleaning</option>
    <option value="Oven Cleaning">Oven Cleaning</option>
    <option value="Gutter Cleaning">Gutter Cleaning</option>
    <option value="Car Valeting">Car Valeting</option>
    <option value="Domestic Cleaning">Domestic Cleaning</option>
    <option value="End of Tenancy">End of Tenancy</option>
    <option value="Carpet Cleaning">Carpet Cleaning</option>
  </select>
</div>

            </div>
          </motion.div>

          {/* Results section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {loading ? (
              <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8">
                <LoadingSpinner />
              </div>
            ) : filteredCleaners.length === 0 ? (
              <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8">
                <EmptyState />
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredCleaners.map((cleaner, index) => (
                  <motion.div
                    key={cleaner._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 ease-in-out"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex items-center gap-6">
                        {/* Cleaner Profile Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={cleaner.image || '/default-avatar.png'}
                            alt={cleaner.realName || 'Cleaner'}
                            className="w-20 h-20 object-cover rounded-full border-2 border-white/50 shadow-lg"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-teal-800 mb-2">{cleaner.realName}</h3>
                              <p className="text-gray-700 font-medium mb-2">{cleaner.companyName}</p>
                              <p className="text-sm text-gray-600 mb-3">Postcode: {cleaner.postcode}</p>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                cleaner.bookingStatus === 'available' 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                                  : cleaner.bookingStatus === 'pending'
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                                  : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                              }`}>
                                {cleaner.bookingStatus?.charAt(0).toUpperCase() + cleaner.bookingStatus?.slice(1) || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 mb-4">
  {/* ⭐ Rating Display */}
  <div className="flex items-center bg-white/50 px-3 py-1 rounded-full">
    <span className="text-sm font-medium text-gray-700">
      ⭐ {cleaner.googleReviewRating || cleaner.rating || 'Unrated'}
      {cleaner.googleReviewCount ? ` (${cleaner.googleReviewCount} reviews)` : ''}
    </span>
  </div>

  {/* 💷 Rates Display */}
  {cleaner.rates && (
    <div className="flex items-center bg-white/50 px-3 py-1 rounded-full">
      <span className="text-sm font-medium text-gray-700">💷 {cleaner.rates}</span>
    </div>
  )}

  {/* ✅ Insured Badge */}
  {cleaner.businessInsurance && (
    <div className="flex items-center bg-green-100 px-3 py-1 rounded-full border border-green-300 shadow-sm">
      <span className="text-sm font-semibold text-green-800">✔ Insured</span>
    </div>
  )}
</div>
</div>
</div>

                      
                      <div className="flex-shrink-0">
                        <Link
                          href={`/cleaners/${cleaner._id}`}
                          className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 ease-in-out font-medium group"
                        >
                          View Profile
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Glass morphism footer */}
      <footer className="relative z-10 bg-white/25 backdrop-blur-[20px] border-t border-white/20 shadow-[0_-8px_32px_rgba(0,0,0,0.1)] mt-16">
        <div className="container mx-auto px-6 py-12">
          <nav className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <Link href="/about" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">About Us</Link>
            <Link href="/terms" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Privacy Policy</Link>
            <Link href="/cookie-policy" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Cookie Policy</Link>
            <Link href="/contact" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Contact</Link>
            <Link href="/faq" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">FAQs</Link>
            <Link href="/sitemap" className="text-teal-800 hover:text-teal-600 transition-colors duration-300">Site Map</Link>
          </nav>

          <div className="text-center text-sm text-gray-700">
            <p className="mb-4 font-medium">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>
            <p className="text-xs leading-relaxed max-w-4xl mx-auto">
              FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
              <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-700 underline transition-colors duration-300">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/cookie-policy" className="text-teal-600 hover:text-teal-700 underline transition-colors duration-300">
                Cookie Policy
              </Link>{' '}
              for details on how we protect your data. You may{' '}
              <Link href="/contact" className="text-teal-600 hover:text-teal-700 underline transition-colors duration-300">
                contact us
              </Link>{' '}
              at any time to manage your personal information.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}