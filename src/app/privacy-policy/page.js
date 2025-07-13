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
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10">
      {/* Glass Morphism Header */}
      <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
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
              <Link 
                href="/cleaners" 
                className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
              >
                Find a Cleaner
              </Link>
              <Link 
                href="/register/cleaners" 
                className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
              >
                List Yourself
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
              >
                How It Works
              </Link>
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
              >
                Login
              </Link>
              <Link 
                href="/blog" 
                className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
              >
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-700 mb-4">
              We respect your privacy and are committed to protecting your personal data
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-[50px] font-medium shadow-lg">
              <span>🔒</span>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-6 pb-16 animate-slide-up">
        <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          
          {/* Effective Date */}
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-6 py-3 rounded-xl mb-8 inline-block">
            <span className="font-semibold">📅 Effective Date: 17 June 2025</span>
          </div>

          <p className="mb-8 text-gray-700 text-lg leading-relaxed">
            Welcome to FindTrustedCleaners (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information.
          </p>

          {/* Section 1 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">1</span>
              What We Collect
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Full Name
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Email Address
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Phone Number
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Address and Postcode
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Payment Information (processed securely via third-party providers)
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Availability and Service Preferences
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Login Credentials (securely hashed)
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  IP Address and Browser Information
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">2</span>
              How We Use Your Information
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  To create and manage your account
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  To facilitate bookings between clients and cleaners
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  To process payments
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  To send service updates and confirmations
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  To improve our services and website
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  To ensure security and fraud prevention
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  To send marketing communications if you have opted in
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">3</span>
              Legal Basis for Processing
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2"></span>
                  <div>
                    <strong className="text-teal-800">Contract:</strong> To provide services you have requested
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2"></span>
                  <div>
                    <strong className="text-teal-800">Consent:</strong> When you agree to receive marketing communications
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2"></span>
                  <div>
                    <strong className="text-teal-800">Legal Obligation:</strong> To comply with legal and regulatory requirements
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2"></span>
                  <div>
                    <strong className="text-teal-800">Legitimate Interests:</strong> To maintain security and improve services
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">4</span>
              Sharing Your Information
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <p className="mb-4 text-gray-700">We may share your information with:</p>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Cleaners and clients for service coordination
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Payment processors
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Hosting and IT support providers
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Regulatory or legal authorities if required
                </li>
              </ul>
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl inline-block">
                <span className="font-semibold">🚫 We never sell your personal data</span>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">5</span>
              Cookies
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <p className="mb-4 text-gray-700">We use cookies to:</p>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Ensure essential website functionality
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Understand how visitors use our website
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Improve user experience
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Track marketing performance (optional cookies)
                </li>
              </ul>
              <p className="text-gray-700">
                For more information, please read our{' '}
                <Link 
                  href="/cookie-policy" 
                  className="text-teal-600 hover:text-teal-800 underline hover:no-underline transition-all duration-300"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">6</span>
              Data Retention
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <p className="text-gray-700">
                We retain your data as long as you have an active account and for up to 6 years after your last activity to comply with legal obligations. You may request account deletion at any time.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">7</span>
              Your Rights
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Request access to your personal data
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Request correction of inaccurate data
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Request deletion of your data
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Object to certain processing activities
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Withdraw consent for marketing communications
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  Request your data in a portable format
                </li>
              </ul>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl inline-block">
                <span className="font-semibold">
                  📧 Contact us at privacy@findtrustedcleaners.co.uk to exercise your rights
                </span>
              </div>
            </div>
          </div>

          {/* Remaining sections with similar styling */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">8</span>
              Security
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <p className="text-gray-700">
                We use SSL encryption, secure password storage, and strict access controls to protect your personal data.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center font-bold">9</span>
              Third-Party Links
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <p className="text-gray-700">
                Our website may contain links to third-party websites. We are not responsible for their privacy practices and recommend reviewing their policies.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center">10</span>
              Data Breach Notification
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <p className="text-gray-700">
                If a data breach occurs, we will notify the Information Commissioner&apos;s Office (ICO) within 72 hours if legally required and inform affected users as appropriate.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center">11</span>
              Changes to This Policy
            </h2>
            <div className="bg-white/80 p-6 rounded-2xl">
              <p className="text-gray-700">
                We may update this Privacy Policy. Changes will be posted on this page.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-8 rounded-2xl text-center">
            <h3 className="text-2xl font-bold mb-4">Questions about this Privacy Policy?</h3>
            <p className="mb-4">If you have any questions, please contact us at:</p>
            <div className="bg-white/20 backdrop-blur-[20px] px-6 py-3 rounded-xl inline-block">
              <span className="font-semibold">privacy@findtrustedcleaners.co.uk</span>
            </div>
          </div>
        </div>
      </section>

      {/* Glass Morphism Footer */}
      <footer className="bg-white/25 backdrop-blur-[20px] border-t border-white/20 py-8 px-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto">
          <nav className="flex flex-wrap justify-center gap-6 mb-6">
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
            >
              About Us
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
            >
              Terms & Conditions
            </Link>
            <Link 
              href="/privacy-policy" 
              className="text-teal-600 bg-white/20 px-3 py-2 rounded-xl font-medium"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/cookie-policy" 
              className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
            >
              Cookie Policy
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
            >
              Contact
            </Link>
            <Link 
              href="/faq" 
              className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
            >
              FAQs
            </Link>
            <Link 
              href="/sitemap" 
              className="text-gray-700 hover:text-teal-600 hover:bg-white/20 px-3 py-2 rounded-xl transition-all duration-300"
            >
              Site Map
            </Link>
          </nav>

          <div className="text-center text-gray-700">
            <p className="mb-4 font-medium">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>
            <p className="text-sm leading-relaxed">
              FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
              <Link 
                href="/privacy-policy" 
                className="text-teal-600 hover:text-teal-800 underline hover:no-underline transition-all duration-300"
              >
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link 
                href="/cookie-policy" 
                className="text-teal-600 hover:text-teal-800 underline hover:no-underline transition-all duration-300"
              >
                Cookie Policy
              </Link>
              {' '}for details on how we protect your data. You may{' '}
              <Link 
                href="/contact" 
                className="text-teal-600 hover:text-teal-800 underline hover:no-underline transition-all duration-300"
              >
                contact us
              </Link>
              {' '}at any time to manage your personal information.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
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