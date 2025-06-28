'use client';

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-700">
      <Head>
        <title>About Us | FindTrustedCleaners</title>
        <meta name="description" content="Learn about the family-run team behind FindTrustedCleaners, helping connect reliable local cleaners with households across the UK." />
        <meta name="keywords" content="About FindTrustedCleaners, Oven Detailing, family-run cleaning, trusted local cleaners, home services" />
        <meta property="og:title" content="About Us | FindTrustedCleaners" />
        <meta property="og:description" content="Family-run and friendly, we're the team behind Oven Detailing – and we created FindTrustedCleaners to connect trusted local cleaners with people who need help at home." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.findtrustedcleaners.co.uk/about" />
      </Head>

      {/* Header */}
      <header className="bg-[#0D9488] text-white py-4 px-6 shadow">
        <div className="flex justify-between items-center">
          <Link href="/">
            <Image src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" width={128} height={40} />
          </Link>
          <nav className="space-x-6 text-sm font-medium">
            <Link href="/cleaners" className="hover:underline">Find a Cleaner</Link>
            <Link href="/register/cleaners" className="hover:underline">List Yourself</Link>
            <Link href="/how-it-works" className="hover:underline">How It Works</Link>
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/blog" className="hover:underline">Blog</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative text-center py-16 bg-[#0D9488] text-white">
        <h1 className="text-4xl font-bold mb-2">About FindTrustedCleaners</h1>
        <p className="text-lg">Connecting reliable local cleaners with real homes across the UK.</p>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto p-6 space-y-6">
        <p>Hi there – we&#39;re the same friendly folks behind <a href="https://www.ovendetailing.com" className="text-teal-600 underline" target="_blank" rel="noopener noreferrer">www.OvenDetailing.com</a>, a small, family-run oven cleaning business based in West Sussex.</p>

        <p>Over the years, we&#39;ve been asked again and again: <strong>&#34;Do you know a good cleaner?&#34;</strong> It turns out <em>a lot</em> of people are searching for help they can actually trust – and many great local cleaners are trying to find regular work without signing up to expensive apps or bidding against each other for jobs.</p>

        <p>So, we thought – why not build something simple that works for everyone?</p>

        {/* Values Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-100 rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold mb-2 text-[#0D9488]">Our Mission</h2>
            <p>FindTrustedCleaners connects reliable local cleaners with everyday people who just want their homes looked after – without the fuss, subscription fees, or salesy nonsense.</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold mb-2 text-[#0D9488]">Who We Are</h2>
            <p>We&#39;re not a faceless corporation. We&#39;re a small, family-run team from West Sussex trying to make life easier for cleaners and families alike.</p>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-[#0D9488]">Why People Choose Us</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Clarity:</strong> See cleaner availability before you book.</li>
            <li><strong>Fairness:</strong> No crazy commission fees or hidden charges.</li>
            <li><strong>Trust:</strong> Only verified contact details are shared after booking.</li>
            <li><strong>Support:</strong> Helping independent cleaners and families thrive.</li>
          </ul>
        </section>

        {/* Why We Built It */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-[#0D9488]">Why We Built It</h2>
          <p className="mb-4">We know what it&#39;s like to juggle work, family, and cleaning. We also know what it&#39;s like to run a local service business, doing the graft and hoping the next job will come through.</p>

          <p className="mb-4"><strong>FindTrustedCleaners</strong> bridges that gap. It&#39;s a space where:</p>

          <ul className="list-disc list-inside space-y-2">
            <li>Cleaners don&#39;t have to pay to list or fight over leads.</li>
            <li>Clients don&#39;t have to endlessly message or second guess who to trust.</li>
          </ul>

          <p className="mt-4">Just honest, real-time info – and real people behind it.</p>
        </section>

        {/* Contact Section */}
        <section className="mt-8">
          <p className="text-sm">Thanks for stopping by. Whether you&#39;re booking a cleaner or listing your services – we&#39;re genuinely glad you&#39;re here. Need to reach us? Pop over to our <Link href="/contact" className="underline text-teal-600">Contact Page</Link> or email: <strong>hello@findtrustedcleaners.co.uk</strong></p>
        </section>
      </section>

      {/* Footer */}
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
