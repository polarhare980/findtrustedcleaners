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
        {/* Open Graph and Twitter meta tags */}
      </Head>

      <main className="min-h-screen bg-white text-gray-700">
        <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] shadow text-white">
          <Link href="/">
            <Image src="/findtrusted-logo.png" alt="FindTrustedCleaners Logo" className="w-32 h-auto" width={128} height={40} />
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
            Whether you're looking to book a trusted cleaner or list your own services, here's exactly how FindTrustedCleaners makes the process simple, transparent, and local.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Clients Section */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-[#0D9488]">For Clients</h2>
              <ul className="space-y-4 text-lg text-gray-700">
                <li><span className="font-bold text-[#0D9488]">🧹</span> Browse local cleaners for free</li>
                <li><span className="font-bold text-[#0D9488]">📅</span> See available hours, ratings, and pricing</li>
                <li><span className="font-bold text-[#0D9488]">📝</span> Request a time slot with your chosen cleaner</li>
                <li><span className="font-bold text-[#0D9488]">⏳</span> No payment is taken until the cleaner approves your request</li>
                <li><span className="font-bold text-[#0D9488]">✅</span> Once approved, you complete the payment and unlock the cleaner&apos;s verified contact info</li> {/* Escaped apostrophe */}
                <li><span className="font-bold text-[#0D9488]">🔓</span> Pending markers will be shown on requested slots to avoid double booking</li>
              </ul>
            </div>

            {/* Cleaners Section */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-[#0D9488]">For Cleaners</h2>
              <ul className="space-y-4 text-lg text-gray-700">
                <li><span className="font-bold text-[#0D9488]">🧼</span> Register your cleaning business for free</li>
                <li><span className="font-bold text-[#0D9488]">🗓️</span> Select your working hours on an easy grid</li>
                <li><span className="font-bold text-[#0D9488]">👁️</span> Your availability is visible to clients (but contact info is protected)</li>
                <li><span className="font-bold text-[#0D9488]">📥</span> Receive booking requests and approve or decline them via your dashboard</li>
                <li><span className="font-bold text-[#0D9488]">💰</span> Only when you approve a request does the client complete payment and unlock your contact details</li>
                <li><span className="font-bold text-[#0D9488]">✅</span> Keep your availability up to date to avoid double bookings</li>
              </ul>
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
