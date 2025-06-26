'use client';
import Link from 'next/link';

export default function SiteMapPage() {
  return (
    <main className="min-h-screen bg-white text-gray-700">
      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] text-white shadow">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-6 text-sm font-medium">
          <Link href="/cleaners">Find a Cleaner</Link>
          <Link href="/register/cleaners">List Yourself</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/login">Login</Link>
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
      </header>

      <section className="max-w-3xl mx-auto p-6 py-12">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-8 text-center">Site Map</h1>

        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/about">About Us</Link></li>
          <li><Link href="/cleaners">Find a Cleaner</Link></li>
          <li><Link href="/register">Register (Cleaner)</Link></li>
          <li><Link href="/register/client">Register (Client)</Link></li>
          <li><Link href="/login">Login</Link></li>
          <li><Link href="/how-it-works">How It Works</Link></li>
          <li><Link href="/faq">FAQ</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/terms">Terms & Conditions</Link></li>
          <li><Link href="/privacy-policy">Privacy Policy</Link></li>
          <li><Link href="/sitemap">Site Map</Link></li>
        </ul>
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