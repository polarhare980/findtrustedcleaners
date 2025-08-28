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
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        <main className="max-w-4xl mx-auto p-6 py-12">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6">
              🍪 Cookie Policy
            </h1>

            <p className="text-gray-700 mb-6 text-lg">
              This Cookie Policy explains how FindTrustedCleaners.co.uk ("we", "our", "us") uses cookies and similar tracking technologies when you visit our website.
            </p>

            {/* Section 1 */}
            <Section
              number="1"
              title="What Are Cookies?"
              content="Cookies are small text files that are stored on your device when you visit a website. They help improve your browsing experience and provide site functionality."
            />

            {/* Section 2 */}
            <Section
              number="2"
              title="How We Use Cookies"
              content="We use cookies for the following purposes:"
              blocks={[
                { icon: '⚡', label: 'Essential', text: 'To enable core website functionality.' },
                { icon: '📊', label: 'Performance', text: 'To understand how users interact with the website.' },
                { icon: '🎯', label: 'Functionality', text: 'To remember your preferences.' },
                { icon: '📈', label: 'Analytics', text: 'To improve our services through data analysis.' },
              ]}
            />

            {/* Section 3 */}
            <Section
              number="3"
              title="Types of Cookies We Use"
              cookieTypes
            />

            {/* Section 4 */}
            <Section
              number="4"
              title="Managing Cookies"
              content="You can manage or delete cookies in your browser settings at any time. You can also control non-essential cookies using our Cookie Consent banner."
              highlight={{
                icon: '⚙️',
                label: 'Cookie Management Tools',
                description: 'Access your browser settings or use our cookie consent banner to customize your preferences.',
              }}
            />

            {/* Section 5 */}
            <Section
              number="5"
              title="Third-Party Services"
              content="We may use third-party services like Google Analytics to track website usage. These services may set their own cookies, which we do not control."
            />

            {/* Section 6 */}
            <Section
              number="6"
              title="Changes to This Cookie Policy"
              content="We may update this Cookie Policy from time to time. Changes will be posted on this page."
            />

            {/* Section 7 */}
            <Section
              number="7"
              title="Contact Us"
              content="If you have questions about this policy, please contact us at:"
              highlight={{
                icon: '📧',
                label: 'privacy@findtrustedcleaners.co.uk',
              }}
            />

            {/* Privacy Policy Link */}
            <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-2xl p-6 border border-teal-200/50">
              <p className="text-gray-700">
                Please also read our{' '}
                <Link
                  href="/privacy-policy"
                  className="text-teal-700 font-semibold hover:text-teal-800 transition-colors duration-300 underline underline-offset-2"
                >
                  Privacy Policy
                </Link>{' '}
                for more details on how we protect your personal data.
              </p>
            </div>
          </div>
        </main>
      </div>

      <footer className="bg-gradient-to-r from-teal-600 to-teal-700 text-white border-t border-teal-500/20 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <nav className="flex flex-wrap justify-center gap-6 mb-6">
            {[
              { href: '/about', label: 'About Us' },
              { href: '/terms', label: 'Terms & Conditions' },
              { href: '/privacy-policy', label: 'Privacy Policy' },
              { href: '/cookie-policy', label: 'Cookie Policy' },
              { href: '/contact', label: 'Contact' },
              { href: '/faq', label: 'FAQs' },
              { href: '/sitemap', label: 'Site Map' },
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

          <div className="text-center">
            <p className="text-white/90 mb-4 text-lg">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-4xl mx-auto">
              <p className="text-white/80 text-sm leading-relaxed">
                FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
                <Link href="/privacy-policy" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/cookie-policy" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  Cookie Policy
                </Link>{' '}
                for details on how we protect your data. You may{' '}
                <Link href="/contact" className="text-white underline underline-offset-2 hover:text-teal-100 transition-colors duration-300">
                  contact us
                </Link>{' '}
                at any time to manage your personal information.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// 🧩 Reusable content section component (you can extract to /components if needed)
function Section({ number, title, content, blocks = [], cookieTypes = false, highlight }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-semibold text-teal-800 mb-4 flex items-center gap-3">
        <span className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {number}
        </span>
        {title}
      </h2>
      <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
        {content && <p className="text-gray-700 mb-4">{content}</p>}

        {blocks.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {blocks.map((block, i) => (
              <div key={i} className="rounded-xl p-4 border bg-white/40 border-gray-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{block.icon} {block.label}:</span>
                </div>
                <p className="text-gray-700 text-sm">{block.text}</p>
              </div>
            ))}
          </div>
        )}

        {cookieTypes && (
          <div className="space-y-4">
            {[
              {
                color: 'teal',
                label: 'Session Cookies',
                desc: 'Temporary cookies that are erased when you close your browser.',
                icon: 'S',
              },
              {
                color: 'blue',
                label: 'Persistent Cookies',
                desc: 'Remain on your device for a set period or until deleted.',
                icon: 'P',
              },
              {
                color: 'amber',
                label: 'Third-Party Cookies',
                desc: 'Cookies set by third-party services (e.g. Google Analytics).',
                icon: '3',
              },
            ].map((type, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 p-4 rounded-xl border bg-gradient-to-r from-${type.color}-50/50 to-white/50 border-${type.color}-100/50`}
              >
                <div className={`w-12 h-12 bg-gradient-to-r from-${type.color}-500 to-${type.color}-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {type.icon}
                </div>
                <div>
                  <h3 className={`font-semibold text-${type.color}-800 mb-1`}>{type.label}</h3>
                  <p className="text-gray-700 text-sm">{type.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {highlight && (
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-xl mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{highlight.icon}</span>
              <span className="font-semibold">{highlight.label}</span>
            </div>
            {highlight.description && (
              <p className="text-sm opacity-90">{highlight.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}