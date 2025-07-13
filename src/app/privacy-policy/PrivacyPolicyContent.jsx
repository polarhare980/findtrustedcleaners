'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicyContent() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10">
      {/* Header (unchanged) */}
      <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="transform hover:scale-105 transition-all duration-300">
              <Image 
                src="/findtrusted-logo.png" 
                alt="FindTrustedCleaners Logo" 
                className="w-32 h-auto" 
                width={128} 
                height={40} 
              />
            </Link>
            <nav className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/cleaners" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Find a Cleaner</Link>
              <Link href="/register/cleaners" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">List Yourself</Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">How It Works</Link>
              <Link href="/login" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105">Login</Link>
              <Link href="/blog" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300">Blog</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-700 mb-4">
              We respect your privacy and are committed to protecting your personal data.
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-[50px] font-medium shadow-lg">
              <span>🔒</span>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Full Policy Body */}
      <section className="max-w-4xl mx-auto px-6 pb-16 animate-slide-up">
        <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-md text-gray-800 space-y-10 text-lg leading-relaxed">
          <p><strong>Effective Date:</strong> 17 June 2025</p>

          <h2 className="text-2xl font-semibold text-teal-800">1. Information We Collect</h2>
          <ul className="list-disc list-inside">
            <li>Full Name, Email Address, Phone Number</li>
            <li>Address and Postcode</li>
            <li>Payment information (handled by third parties)</li>
            <li>Availability and service preferences</li>
            <li>Login credentials (securely hashed)</li>
            <li>IP address, browser, and usage info</li>
          </ul>

          <h2 className="text-2xl font-semibold text-teal-800">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside">
            <li>To manage your account and preferences</li>
            <li>To facilitate cleaner bookings and payments</li>
            <li>To send service updates and reminders</li>
            <li>To improve the platform and user experience</li>
            <li>To comply with legal obligations</li>
            <li>To send marketing (only if opted-in)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-teal-800">3. Legal Basis for Processing</h2>
          <ul className="list-disc list-inside">
            <li><strong>Contract:</strong> To provide requested services</li>
            <li><strong>Consent:</strong> For marketing or optional features</li>
            <li><strong>Legal Obligation:</strong> HMRC, fraud, etc.</li>
            <li><strong>Legitimate Interest:</strong> Platform integrity, analytics</li>
          </ul>

          <h2 className="text-2xl font-semibold text-teal-800">4. Sharing Your Information</h2>
          <ul className="list-disc list-inside">
            <li>With cleaners and clients as needed to coordinate jobs</li>
            <li>With secure payment processors (e.g., Stripe)</li>
            <li>With analytics or hosting providers (non-identifiable info)</li>
            <li>With regulators or legal authorities when required</li>
          </ul>
          <p><strong>We never sell your personal data.</strong></p>

          <h2 className="text-2xl font-semibold text-teal-800">5. Cookies</h2>
          <p>We use cookies to enhance your experience, analyse usage, and support basic functionality. You can manage cookie settings in your browser.</p>

          <h2 className="text-2xl font-semibold text-teal-800">6. Data Retention</h2>
          <p>We retain personal data for as long as you have an account, and up to 6 years after your last activity to comply with legal and tax obligations.</p>

          <h2 className="text-2xl font-semibold text-teal-800">7. Your Rights</h2>
          <ul className="list-disc list-inside">
            <li>Access your data</li>
            <li>Correct inaccurate info</li>
            <li>Request deletion</li>
            <li>Withdraw consent for marketing</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-2xl font-semibold text-teal-800">8. Security</h2>
          <p>We use HTTPS, secure databases, access control, and best practices to keep your data safe.</p>

          <h2 className="text-2xl font-semibold text-teal-800">9. Third-Party Links</h2>
          <p>We may link to third-party websites. We are not responsible for their privacy policies.</p>

          <h2 className="text-2xl font-semibold text-teal-800">10. Data Breach Notification</h2>
          <p>If a breach occurs, we will notify affected users and relevant authorities within 72 hours if required.</p>

          <h2 className="text-2xl font-semibold text-teal-800">11. Changes to This Policy</h2>
          <p>We may update this policy. Material changes will be clearly communicated on this page.</p>

          <h2 className="text-2xl font-semibold text-teal-800">Contact Us</h2>
          <p>
            For any questions, please contact us at{' '}
            <a href="mailto:privacy@findtrustedcleaners.co.uk" className="text-teal-600 underline">
              privacy@findtrustedcleaners.co.uk
            </a>
          </p>
        </div>
      </section>

      {/* Footer (unchanged) */}
      <footer className="bg-white/25 backdrop-blur-[20px] border-t border-white/20 py-8 px-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <nav className="flex flex-wrap justify-center gap-6 mb-6">
            <Link href="/about" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl">About Us</Link>
            <Link href="/terms" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="text-teal-600 bg-white/20 px-3 py-2 rounded-xl font-medium">Privacy Policy</Link>
            <Link href="/cookie-policy" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl">Cookie Policy</Link>
            <Link href="/contact" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl">Contact</Link>
            <Link href="/faq" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl">FAQs</Link>
            <Link href="/sitemap" className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl">Site Map</Link>
          </nav>
          <div className="text-center text-gray-700">
            <p className="mb-4 font-medium">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>
            <p className="text-sm leading-relaxed">
              FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
              <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-800 underline hover:no-underline">Privacy Policy</Link>{' '}
              and{' '}
              <Link href="/cookie-policy" className="text-teal-600 hover:text-teal-800 underline hover:no-underline">Cookie Policy</Link>{' '}
              to learn how we protect your data. You can also{' '}
              <Link href="/contact" className="text-teal-600 hover:text-teal-800 underline hover:no-underline">contact us</Link>{' '}
              to manage your information.
            </p>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}
