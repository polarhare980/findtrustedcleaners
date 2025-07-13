import Link from 'next/link';

// ✅ SEO Meta Tags
export const metadata = {
  title: 'Cookie Policy | FindTrustedCleaners',
  description: 'Understand how FindTrustedCleaners uses cookies and how you can manage your preferences.',
  openGraph: {
    title: 'Cookie Policy | FindTrustedCleaners',
    description: 'FindTrustedCleaners uses cookies to improve your experience. Read our Cookie Policy to manage your preferences.',
    url: 'https://www.findtrustedcleaners.co.uk/cookie-policy',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Cookie Policy - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

export default function CookiePolicy() {
  return (
    <>
      {/* Background with gradient overlay */}
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        {/* Glass morphism container */}
        <main className="max-w-4xl mx-auto p-6 py-12">
          {/* Main content card with glass morphism */}
          <div 
            className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 mb-8 animate-[fadeIn_0.8s_ease-out]"
            style={{ animationName: 'fadeIn' }}
          >
            {/* Header with gradient text */}
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6">
              🍪 Cookie Policy
            </h1>

            <p className="text-gray-700 mb-6 text-lg">
              This Cookie Policy explains how FindTrustedCleaners.co.uk (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) uses cookies and similar tracking technologies when you visit our website.
            </p>

            {/* Section 1 */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">1</span>
                What Are Cookies?
              </h2>
              <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <p className="text-gray-700 leading-relaxed">
                  Cookies are small text files that are stored on your device when you visit a website. They help improve your browsing experience and provide site functionality.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">2</span>
                How We Use Cookies
              </h2>
              <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <p className="text-gray-700 mb-4">We use cookies for the following purposes:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-xl p-4 border border-teal-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-teal-600 font-semibold">⚡ Essential:</span>
                    </div>
                    <p className="text-gray-700 text-sm">To enable core website functionality.</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 font-semibold">📊 Performance:</span>
                    </div>
                    <p className="text-gray-700 text-sm">To understand how users interact with the website.</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 font-semibold">🎯 Functionality:</span>
                    </div>
                    <p className="text-gray-700 text-sm">To remember your preferences.</p>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-600 font-semibold">📈 Analytics:</span>
                    </div>
                    <p className="text-gray-700 text-sm">To improve our services through data analysis.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">3</span>
                Types of Cookies We Use
              </h2>
              <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-teal-50/50 to-white/50 rounded-xl border border-teal-100/50">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      S
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-800 mb-1">Session Cookies</h3>
                      <p className="text-gray-700 text-sm">Temporary cookies that are erased when you close your browser.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50/50 to-white/50 rounded-xl border border-blue-100/50">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      P
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-1">Persistent Cookies</h3>
                      <p className="text-gray-700 text-sm">Remain on your device for a set period or until deleted.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50/50 to-white/50 rounded-xl border border-amber-100/50">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-1">Third-Party Cookies</h3>
                      <p className="text-gray-700 text-sm">Cookies set by third-party services (e.g. Google Analytics).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">4</span>
                Managing Cookies
              </h2>
              <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <p className="text-gray-700 mb-4">
                  You can manage or delete cookies in your browser settings at any time. You can also control non-essential cookies using our Cookie Consent banner.
                </p>
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⚙️</span>
                    <span className="font-semibold">Cookie Management Tools</span>
                  </div>
                  <p className="text-sm opacity-90">Access your browser settings or use our cookie consent banner to customize your preferences.</p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">5</span>
                Third-Party Services
              </h2>
              <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <p className="text-gray-700">
                  We may use third-party services like Google Analytics to track website usage. These services may set their own cookies, which we do not control.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">6</span>
                Changes to This Cookie Policy
              </h2>
              <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <p className="text-gray-700">
                  We may update this Cookie Policy from time to time. Changes will be posted on this page.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">7</span>
                Contact Us
              </h2>
              <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                <p className="text-gray-700 mb-4">
                  If you have questions about this policy, please contact us at:
                </p>
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-xl inline-block">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📧</span>
                    <span className="font-semibold">privacy@findtrustedcleaners.co.uk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Policy Link */}
            <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-2xl p-6 border border-teal-200/50">
              <p className="text-gray-700">
                Please also read our{' '}
                <Link 
                  href="/privacy-policy" 
                  className="text-teal-700 font-semibold hover:text-teal-800 transition-colors duration-300 underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                {' '}for more details on how we protect your personal data.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Footer with glass morphism */}
      <footer className="bg-gradient-to-r from-teal-600 to-teal-700 text-white border-t border-teal-500/20 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6 mb-6">
            {[
              { href: '/about', label: 'About Us' },
              { href: '/terms', label: 'Terms & Conditions' },
              { href: '/privacy-policy', label: 'Privacy Policy' },
              { href: '/cookie-policy', label: 'Cookie Policy' },
              { href: '/contact', label: 'Contact' },
              { href: '/faq', label: 'FAQs' },
              { href: '/sitemap', label: 'Site Map' }
            ].map((link, index) => (
              <Link 
                key={index}
                href={link.href}
                className="text-white/90 hover:text-white hover:scale-105 transition-all duration-300 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-white/90 mb-4 text-lg">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-4xl mx-auto">
              <p className="text-white/80 text-sm leading-relaxed">
                FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
                <Link href="/privacy-policy" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link href="/cookie-policy" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  Cookie Policy
                </Link>
                {' '}for details on how we protect your data. You may{' '}
                <Link href="/contact" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  contact us
                </Link>
                {' '}at any time to manage your personal information.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Add custom animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}