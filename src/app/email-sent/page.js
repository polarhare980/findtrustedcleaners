'use client';

import Link from 'next/link';

export default function EmailSentPage() {
  return (
    <main className="min-h-screen bg-white text-gray-700 text-center px-6 py-20">
      <h1 className="text-3xl font-bold text-[#0D9488] mb-4">Check Your Email</h1>
      <p className="mb-6">
        We’ve sent a password reset link to your email address. Follow the instructions there to update your password.
      </p>
      <Link
        href="/login"
        className="inline-block bg-[#0D9488] text-white px-6 py-3 rounded shadow hover:bg-teal-700"
      >
        Back to Login
      </Link>

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
