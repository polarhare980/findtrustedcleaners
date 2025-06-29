'use client';

import Link from 'next/link';

// ✅ SEO Meta Tags
export const metadata = {
  title: 'Terms and Conditions | FindTrustedCleaners',
  description: 'Review the terms and conditions for using the FindTrustedCleaners platform, including responsibilities and booking policies.',
  openGraph: {
    title: 'Terms and Conditions | FindTrustedCleaners',
    description: 'Review the terms and conditions for using the FindTrustedCleaners platform, including responsibilities and booking policies.',
    url: 'https://www.findtrustedcleaners.co.uk/terms',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Terms and Conditions - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-white text-gray-700">
      <section className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-4">Terms and Conditions</h1>
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
            <p>
              Welcome to FindTrustedCleaners.co.uk. By using our platform, you agree to these terms and conditions. Please read them carefully before registering or booking a service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2. Definitions</h2>
            <p>
              &quot;Platform&quot; refers to our website. &quot;Cleaner&quot; refers to an individual or business offering cleaning services. &quot;Client&quot; refers to any individual using the platform to find or contact a cleaner.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3. Registration</h2>
            <p>
              Users must provide accurate and complete information when registering. We reserve the right to suspend or terminate any account for violations of these terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4. Booking and Payments</h2>
            <p>
              Clients may be required to pay a fee to access cleaner contact information. All further arrangements, including payment for services, are between the cleaner and the client directly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5. Responsibilities</h2>
            <p>
              We are not liable for the quality of work or conduct of cleaners listed on the platform. Clients and cleaners are encouraged to communicate clearly and document agreements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6. Content and Reviews</h2>
            <p>
              Users may leave reviews. We reserve the right to remove inappropriate or abusive content at our discretion.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">7. Privacy</h2>
            <p>
              We respect your privacy. Please refer to our <Link href="/privacy-policy" className="text-blue-600 underline">Privacy Policy</Link> for details on how your data is handled.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">8. Changes</h2>
            <p>
              We may update these terms at any time. Continued use of the platform indicates acceptance of any updates.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
            <p>
              If you have questions about these terms, please contact us at <strong>support@findtrustedcleaners.co.uk</strong>.
            </p>
          </div>
        </section>
      </section>

      <footer className="bg-teal-600 border-t py-6 px-6 text-center text-sm text-white">
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
