'use client';

import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How It Works | Find Trusted Cleaners</title>
        <meta name="description" content="Learn how Find Trusted Cleaners connects clients with reliable local cleaning professionals. Simple, transparent, and effective." />
        <meta name="keywords" content="how Find Trusted Cleaners works, cleaning service platform, hire cleaners, list cleaning business" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main className="min-h-screen bg-white text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
        <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] shadow text-white">
          <Link href="/">
            <Image src="/findtrusted-logo.png" alt="Find Trusted Cleaners Logo" className="w-32 h-auto" width={128} height={40} />
          </Link>
          <nav className="space-x-6 text-sm font-medium">
            <Link href="/" className="hover:text-gray-200">Home</Link>
            <Link href="/cleaners" className="hover:text-gray-200">Find a Cleaner</Link>
            <Link href="/register/cleaners" className="hover:text-gray-200">List Yourself</Link>
            <Link href="/how-it-works" className="hover:text-gray-200">How It Works</Link>
            <Link href="/login" className="hover:text-gray-200">Login</Link>
            <Link href="/blog" className="hover:text-gray-200">Blog</Link>
          </nav>
        </header>

        <section className="px-6 py-10 max-w-4xl mx-auto">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/">Home</Link> &gt; How It Works
          </nav>
          <h1 className="text-4xl font-semibold text-[#0D9488] mb-4 text-center">How It Works</h1>
          <p className="text-center text-gray-700 mb-10 text-lg">
            Whether you are looking to book a trusted cleaner or list your own services, here is exactly how FindTrustedCleaners makes the process simple, transparent, and local.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Clients Section */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-6 text-[#0D9488] border-b pb-4">For Clients</h2>
              <ol className="space-y-6 text-lg text-gray-700 list-decimal list-inside">
                <li>Browse local cleaners for free.</li>
                <li>See available hours, ratings, and pricing.</li>
                <li>Request a time slot with your chosen cleaner.</li>
                <li>No payment is taken until the cleaner approves your request.</li>
                <li>Once approved, you complete the payment and unlock the cleaner&apos;s verified contact information.</li>
                <li>Requested slots are marked to prevent double booking.</li>
              </ol>
            </div>

            {/* Cleaners Section */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-6 text-[#0D9488] border-b pb-4">For Cleaners</h2>
              <ol className="space-y-6 text-lg text-gray-700 list-decimal list-inside">
                <li>Register your cleaning business for free.</li>
                <li>Select your working hours using an easy grid system.</li>
                <li>Your availability is visible to clients but your contact information remains protected until booking confirmation.</li>
                <li>Receive booking requests and approve or decline them via your dashboard.</li>
                <li>Payment is only completed once you approve a request, then your contact details are shared.</li>
                <li>Keep your availability up to date to avoid double bookings.</li>
              </ol>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/register/client" className="bg-[#0D9488] text-white px-6 py-3 rounded shadow hover:bg-teal-700 text-lg transition duration-300 ease-in-out transform hover:scale-105">
              Register as a Client
            </Link>
            <Link href="/register/cleaner" className="bg-white text-[#0D9488] border border-[#0D9488] px-6 py-3 rounded shadow hover:bg-teal-700 hover:text-white text-lg transition duration-300 ease-in-out transform hover:scale-105">
              Register as a Cleaner
            </Link>
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
    </>
  );
}
