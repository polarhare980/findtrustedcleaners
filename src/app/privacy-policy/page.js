'use client';

import Link from 'next/link';
import Image from 'next/image';

// ✅ SEO Meta Tags
export const metadata = {
  title: 'Privacy Policy | FindTrustedCleaners',
  description: 'Privacy Policy for FindTrustedCleaners. Learn how we collect, use, and protect your data.',
  keywords: 'Privacy, Data Policy, FindTrustedCleaners, GDPR, Cookies, Personal Information',
  openGraph: {
    title: 'Privacy Policy | FindTrustedCleaners',
    description: 'How we collect, use, and protect personal data at FindTrustedCleaners.',
    url: 'https://www.findtrustedcleaners.co.uk/privacy-policy',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Privacy Policy - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
  robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-700">

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

      <section className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-6">Privacy Policy</h1>

        <p className="mb-4 font-medium">Effective Date: 17 June 2025</p>

        <p className="mb-4">Welcome to FindTrustedCleaners (&#34;we,&#34; &#34;us,&#34; or &#34;our&#34;). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">1. What We Collect</h2>
        <ul className="list-disc list-inside mb-4">
          <li>Full Name</li>
          <li>Email Address</li>
          <li>Phone Number</li>
          <li>Address and Postcode</li>
          <li>Payment Information (processed securely via third-party providers)</li>
          <li>Availability and Service Preferences</li>
          <li>Login Credentials (securely hashed)</li>
          <li>IP Address and Browser Information</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
        <ul className="list-disc list-inside mb-4">
          <li>To create and manage your account</li>
          <li>To facilitate bookings between clients and cleaners</li>
          <li>To process payments</li>
          <li>To send service updates and confirmations</li>
          <li>To improve our services and website</li>
          <li>To ensure security and fraud prevention</li>
          <li>To send marketing communications if you have opted in</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">3. Legal Basis for Processing</h2>
        <ul className="list-disc list-inside mb-4">
          <li><strong>Contract:</strong> To provide services you have requested</li>
          <li><strong>Consent:</strong> When you agree to receive marketing communications</li>
          <li><strong>Legal Obligation:</strong> To comply with legal and regulatory requirements</li>
          <li><strong>Legitimate Interests:</strong> To maintain security and improve services</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">4. Sharing Your Information</h2>
        <p className="mb-4">We may share your information with:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Cleaners and clients for service coordination</li>
          <li>Payment processors</li>
          <li>Hosting and IT support providers</li>
          <li>Regulatory or legal authorities if required</li>
        </ul>
        <p className="mb-4">We never sell your personal data.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">5. Cookies</h2>
        <p className="mb-4">We use cookies to:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Ensure essential website functionality</li>
          <li>Understand how visitors use our website</li>
          <li>Improve user experience</li>
          <li>Track marketing performance (optional cookies)</li>
        </ul>
        <p className="mb-4">For more information, please read our <Link href="/cookie-policy" className="text-blue-600 underline">Cookie Policy</Link>.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">6. Data Retention</h2>
        <p className="mb-4">We retain your data as long as you have an active account and for up to 6 years after your last activity to comply with legal obligations. You may request account deletion at any time.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">7. Your Rights</h2>
        <ul className="list-disc list-inside mb-4">
          <li>Request access to your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to certain processing activities</li>
          <li>Withdraw consent for marketing communications</li>
          <li>Request your data in a portable format</li>
        </ul>
        <p className="mb-4">Please contact us at <strong>privacy@findtrustedcleaners.co.uk</strong> to exercise your rights.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">8. Security</h2>
        <p className="mb-4">We use SSL encryption, secure password storage, and strict access controls to protect your personal data.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">9. Third-Party Links</h2>
        <p className="mb-4">Our website may contain links to third-party websites. We are not responsible for their privacy practices and recommend reviewing their policies.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">10. Data Breach Notification</h2>
        <p className="mb-4">If a data breach occurs, we will notify the Information Commissioner&#39;s Office (ICO) within 72 hours if legally required and inform affected users as appropriate.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">11. Changes to This Policy</h2>
        <p className="mb-4">We may update this Privacy Policy. Changes will be posted on this page.</p>

        <p className="mt-8 text-sm">If you have any questions, please contact us at <strong>privacy@findtrustedcleaners.co.uk</strong></p>
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
