'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function FindCleanerPage() {
  const [filteredCleaners, setFilteredCleaners] = useState([]);
  const [postcode, setPostcode] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [bookingStatus, setBookingStatus] = useState('all');

  useEffect(() => {
    const fetchFilteredCleaners = async () => {
      try {
        const url = `/api/cleaners?postcode=${postcode}&minRating=${minRating}&bookingStatus=${bookingStatus}`;
        const res = await fetch(url);
        const { cleaners } = await res.json();
        setFilteredCleaners(cleaners);
      } catch (err) {
        console.error('Error fetching cleaners:', err);
      }
    };

    fetchFilteredCleaners();
  }, [postcode, minRating, bookingStatus]);

  return (
    <main className="relative min-h-screen text-[#0D9488]">
      <Head>
        <title>Find a Cleaner | Find Trusted Cleaners</title>
        <meta name="description" content="Search trusted local cleaners by postcode, rating, and availability." />
        <meta name="keywords" content="cleaners near me, local cleaner, book a cleaner, trusted domestic cleaners, cleaner availability, cleaner reviews" />
        <meta property="og:title" content="Find a Cleaner - Find Trusted Cleaners" />
        <meta property="og:description" content="Easily browse local trusted cleaners by availability, rating and postcode. Book now." />
        <meta property="og:image" content="/findtrusted-logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.findtrustedcleaners.co.uk/cleaners" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find a Cleaner - Trusted Local Cleaners" />
        <meta name="twitter:description" content="Browse and book reliable, reviewed cleaners across the UK. Check availability and reviews instantly." />
        <meta name="twitter:image" content="/findtrusted-logo.png" />
        <link rel="canonical" href="https://www.findtrustedcleaners.co.uk/cleaners" />
      </Head>

      <img
        src="/background.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover -z-10 opacity-30"
      />

      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] bg-opacity-90 text-white">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-4 text-sm">
          <Link href="/cleaners" className="hover:text-gray-200">Find Cleaners</Link>
          <Link href="/register/cleaners" className="hover:text-gray-200">Register Cleaner</Link>
          <Link href="/login" className="hover:text-gray-200">Login</Link>
        </nav>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-6 text-center">
          <Link
            href="/register/client"
            className="cta-button"
          >
            Register as a Client
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Enter postcode..."
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="p-2 border rounded w-full bg-white"
          />
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="p-2 border rounded w-full bg-white"
          >
            <option value={0}>Any Rating</option>
            <option value={3}>3★ & above</option>
            <option value={4}>4★ & above</option>
            <option value={5}>5★ only</option>
          </select>
          <select
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            className="p-2 border rounded w-full bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
          </select>
        </div>

        <div className="grid gap-4">
          {filteredCleaners.length === 0 ? (
            <div className="empty-state">
              <p>No cleaners found matching your search criteria.</p>
              <p>Please check back soon — new cleaners are registering all the time!</p>
              <Link href="/" className="cta-button">
                Back to Home
              </Link>
            </div>
          ) : (
            filteredCleaners.map((cleaner) => (
              <div key={cleaner._id} className="cleaner-card">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-xl font-semibold">{cleaner.realName}</h2>
                    <p>{cleaner.companyName} – {cleaner.postcode}</p>
                    <p className="text-sm">💷 {cleaner.rates} | ⭐ {cleaner.rating || 'Unrated'}</p>
                  </div>
                  <div>
                    <span className={`status-badge ${cleaner.bookingStatus === 'pending' ? 'status-pending' : cleaner.bookingStatus === 'available' ? 'status-available' : 'status-booked'}`}>
                      {cleaner.bookingStatus?.charAt(0).toUpperCase() + cleaner.bookingStatus?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/cleaners/${cleaner._id}`}
                  className="cta-button mt-2 inline-block"
                >
                  View Profile
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="bg-[#0D9488] text-white border-t py-6 px-6 text-center text-sm">
        <nav className="flex flex-wrap justify-center gap-4 mb-2">
          <Link href="/about">About Us</Link>
          <Link href="/terms">Terms & Conditions</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/cookie-policy">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/sitemap">Site Map</Link>
        </nav>

        <p className="mb-2">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

        <p className="text-xs">
          FindTrustedCleaners is committed to GDPR compliance. Read our <Link href="/privacy-policy" className="underline">Privacy Policy</Link> and <Link href="/cookie-policy" className="underline">Cookie Policy</Link> for details on how we protect your data. You may <Link href="/contact" className="underline">contact us</Link> at any time to manage your personal information.
        </p>
      </footer>
    </main>
  );
}
