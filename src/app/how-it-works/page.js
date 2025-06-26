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
        <meta property="og:title" content="How It Works - Find Trusted Cleaners" />
        <meta property="og:description" content="Discover how easy it is to find or list local cleaning services on FindTrustedCleaners." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.findtrustedcleaners.co.uk/how-it-works" />
        <meta property="og:image" content="/findtrusted-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How It Works - Find Trusted Cleaners" />
        <meta name="twitter:description" content="Explore how clients and cleaners connect easily and safely on our platform." />
        <meta name="twitter:image" content="/findtrusted-logo.png" />

        {/* Breadcrumb Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.findtrustedcleaners.co.uk/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "How It Works",
                "item": "https://www.findtrustedcleaners.co.uk/how-it-works"
              }
            ]
          })
        }} />
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
          <h1 className="text-3xl font-bold text-[#0D9488] mb-4 text-center">How It Works</h1>
          <p className="text-center text-gray-700 mb-10 text-lg">
            Whether you&#39;re looking to book a trusted cleaner or list your own services, here&#39;s exactly how FindTrustedCleaners makes the process simple, transparent, and local.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-xl font-semibold mb-2">For Clients</h2>
              <ul className="list-inside space-y-2 text-gray-700">
                <li>🧹 Browse local cleaners for free</li>
                <li>📅 See available hours, ratings, and pricing</li>
                <li>📝 Request a time slot with your chosen cleaner</li>
                <li>⏳ No payment is taken until the cleaner approves your request</li>
                <li>✅ Once approved, you complete the payment and unlock the cleaner&#39;s verified contact info</li>
                <li>🔓 Pending markers will be shown on requested slots to avoid double booking</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">For Cleaners</h2>
              <ul className="list-inside space-y-2 text-gray-700">
                <li>🧼 Register your cleaning business for free</li>
                <li>🗓️ Select your working hours on an easy grid</li>
                <li>👁️ Your availability is visible to clients (but contact info is protected)</li>
                <li>📥 Receive booking requests and approve or decline them via your dashboard</li>
                <li>💰 Only when you approve a request does the client complete payment and unlock your contact details</li>
                <li>✅ Keep your availability up to date to avoid double bookings</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/register/client" className="bg-[#0D9488] text-white px-6 py-3 rounded shadow hover:bg-teal-700 text-lg">
              Register as a Client
            </Link>
            <Link href="/register/cleaner" className="bg-[#0D9488] text-white border border-white px-6 py-3 rounded shadow hover:bg-teal-700 text-lg">
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
