'use client';

import Link from 'next/link';

export default function CookiePolicy() {
  return (
    <main className="min-h-screen bg-white text-gray-700 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#0D9488] mb-4">Cookie Policy</h1>

      <p className="mb-4">
        This Cookie Policy explains how FindTrustedCleaners.co.uk ("we", "our", "us") uses cookies and similar tracking technologies when you visit our website.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">1. What Are Cookies?</h2>
      <p className="mb-4">
        Cookies are small text files that are stored on your device when you visit a website. They help improve your browsing experience and provide site functionality.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">2. How We Use Cookies</h2>
      <p className="mb-4">We use cookies for the following purposes:</p>
      <ul className="list-disc list-inside mb-4">
        <li>Essential: To enable core website functionality.</li>
        <li>Performance: To understand how users interact with the website (e.g. page views).</li>
        <li>Functionality: To remember your preferences.</li>
        <li>Analytics: To improve our services and website through data analysis.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">3. Types of Cookies We Use</h2>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Session Cookies:</strong> Temporary cookies that are erased when you close your browser.</li>
        <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until deleted.</li>
        <li><strong>Third-Party Cookies:</strong> Cookies set by third-party services (e.g. Google Analytics).</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">4. Managing Cookies</h2>
      <p className="mb-4">
        You can manage or delete cookies in your browser settings at any time. You can also control non-essential cookies using our Cookie Consent banner.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">5. Third-Party Services</h2>
      <p className="mb-4">
        We may use third-party services like Google Analytics to track website usage. These services may set their own cookies, which we do not control.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">6. Changes to This Cookie Policy</h2>
      <p className="mb-4">
        We may update this Cookie Policy from time to time. Changes will be posted on this page.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">7. Contact Us</h2>
      <p className="mb-4">
        If you have questions about this policy, please contact us at <strong>privacy@findtrustedcleaners.co.uk</strong>.
      </p>

      <p className="text-sm mt-8">
        Please also read our{' '}
        <Link href="/privacy-policy" className="underline text-teal-700">Privacy Policy</Link> for more details on how we protect your personal data.
      </p>
    </main>
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

