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
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-[url('/cleaning-bg.jpg')] bg-cover bg-center opacity-10"></div>
      
      {/* Glass morphism header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/25 border-b border-white/20">
        <div className="max-w-4xl mx-auto p-6">
          <Link href="/" className="text-teal-600 hover:text-teal-700 transition-colors duration-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      <section className="py-12 px-6 max-w-4xl mx-auto relative z-10">
        {/* Hero section with glass morphism */}
        <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 mb-8 shadow-xl">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-4">
            Terms and Conditions
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed">
            Please read these terms carefully before using our platform. By accessing FindTrustedCleaners, you agree to be bound by these terms and conditions.
          </p>
        </div>

        {/* Terms content in glass morphism cards */}
        <div className="space-y-6">
          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  Welcome to FindTrustedCleaners.co.uk. By using our platform, you agree to these terms and conditions. Please read them carefully before registering or booking a service.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Definitions</h2>
                <p className="text-gray-700 leading-relaxed">
                  &quot;Platform&quot; refers to our website. &quot;Cleaner&quot; refers to an individual or business offering cleaning services. &quot;Client&quot; refers to any individual using the platform to find or contact a cleaner.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Registration</h2>
                <p className="text-gray-700 leading-relaxed">
                  Users must provide accurate and complete information when registering. We reserve the right to suspend or terminate any account for violations of these terms.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                4
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Booking and Payments</h2>
                <p className="text-gray-700 leading-relaxed">
                  Clients may be required to pay a fee to access cleaner contact information. All further arrangements, including payment for services, are between the cleaner and the client directly.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                5
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Responsibilities</h2>
                <p className="text-gray-700 leading-relaxed">
                  We are not liable for the quality of work or conduct of cleaners listed on the platform. Clients and cleaners are encouraged to communicate clearly and document agreements.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.5s'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                6
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Content and Reviews</h2>
                <p className="text-gray-700 leading-relaxed">
                  Users may leave reviews. We reserve the right to remove inappropriate or abusive content at our discretion.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.6s'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                7
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We respect your privacy. Please refer to our{' '}
                  <Link href="/privacy-policy" className="text-blue-600 underline hover:text-blue-700 transition-colors duration-300">
                    Privacy Policy
                  </Link>{' '}
                  for details on how your data is handled.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.7s'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                8
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Changes</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update these terms at any time. Continued use of the platform indicates acceptance of any updates.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 shadow-xl hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.8s'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                9
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-teal-800 mb-3">Contact</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have questions about these terms, please contact us at{' '}
                  <span className="font-semibold text-teal-700">support@findtrustedcleaners.co.uk</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action section */}
        <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-[20px] p-8 mt-12 shadow-xl text-center opacity-0 animate-[slideUp_0.5s_ease-out_0.9s_forwards]">
          <h3 className="text-2xl font-semibold text-teal-800 mb-4">Ready to Get Started?</h3>
          <p className="text-gray-700 mb-6">
            By using our platform, you agree to these terms and conditions. Join thousands of satisfied customers today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
              Get Started
            </Link>
            <Link href="/contact" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Glass morphism footer */}
      <footer className="backdrop-blur-md bg-teal-600/90 border-t border-white/20 py-8 px-6 text-center text-sm text-white relative z-10">
        <nav className="flex flex-wrap justify-center gap-6 mb-4">
          <Link href="/about" className="hover:text-teal-200 transition-colors duration-300">About Us</Link>
          <Link href="/terms" className="hover:text-teal-200 transition-colors duration-300">Terms & Conditions</Link>
          <Link href="/privacy-policy" className="hover:text-teal-200 transition-colors duration-300">Privacy Policy</Link>
          <Link href="/cookie-policy" className="hover:text-teal-200 transition-colors duration-300">Cookie Policy</Link>
          <Link href="/contact" className="hover:text-teal-200 transition-colors duration-300">Contact</Link>
          <Link href="/faq" className="hover:text-teal-200 transition-colors duration-300">FAQs</Link>
          <Link href="/sitemap" className="hover:text-teal-200 transition-colors duration-300">Site Map</Link>
        </nav>

        <p className="mb-4 text-white/90">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>

        <p className="text-xs text-white/80 max-w-4xl mx-auto">
          FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
          <Link href="/privacy-policy" className="underline hover:text-teal-200 transition-colors duration-300">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/cookie-policy" className="underline hover:text-teal-200 transition-colors duration-300">
            Cookie Policy
          </Link>{' '}
          for details on how we protect your data. You may{' '}
          <Link href="/contact" className="underline hover:text-teal-200 transition-colors duration-300">
            contact us
          </Link>{' '}
          at any time to manage your personal information.
        </p>
      </footer>


    </main>
  );
}