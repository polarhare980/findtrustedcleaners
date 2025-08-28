import Link from 'next/link';
import Image from 'next/image';

// ✅ SEO Meta Tags for App Router
export const metadata = {
  title: 'About Us | FindTrustedCleaners',
  description: 'Learn about the family-run team behind FindTrustedCleaners, helping connect reliable local cleaners with households across the UK.',
  keywords: 'About FindTrustedCleaners, Oven Detailing, family-run cleaning, trusted local cleaners, home services',
  openGraph: {
    title: 'About Us | FindTrustedCleaners',
    description: 'Family-run and friendly, we created FindTrustedCleaners to connect trusted local cleaners with people who need help at home.',
    url: 'https://www.findtrustedcleaners.co.uk/about',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FindTrustedCleaners About Us',
      },
    ],
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Glass Morphism Header */}
      <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="transition-transform duration-300 hover:scale-105">
            <Image 
              src="/findtrusted-logo.png" 
              alt="Find Trusted Cleaners Logo" 
              className="w-32 h-auto" 
              width={128} 
              height={40} 
              priority
            />
          </Link>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <Link href="/" className="text-gray-700 hover:text-teal-600 transition-colors duration-300 hover:scale-105">Home</Link>
            <Link href="/cleaners" className="text-gray-700 hover:text-teal-600 transition-colors duration-300 hover:scale-105">Find a Cleaner</Link>
            <Link href="/register/cleaners" className="text-gray-700 hover:text-teal-600 transition-colors duration-300 hover:scale-105">List Yourself</Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-teal-600 transition-colors duration-300 hover:scale-105">How It Works</Link>
            <Link href="/about" className="text-teal-700 font-semibold">About</Link>
            <Link href="/login" className="text-gray-700 hover:text-teal-600 transition-colors duration-300 hover:scale-105">Login</Link>
            <Link href="/blog" className="text-gray-700 hover:text-teal-600 transition-colors duration-300 hover:scale-105">Blog</Link>
          </nav>
          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg bg-white/30 backdrop-blur-md border border-white/20">
            <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section with Glass Morphism */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-8">
          <div className="bg-white/30 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 inline-flex items-center gap-2">
            <Link href="/" className="hover:text-teal-600 transition-colors duration-300">Home</Link> 
            <span className="text-teal-600">→</span>
            <span className="text-teal-700 font-medium">About Us</span>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
            About FindTrustedCleaners
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
            Connecting reliable local cleaners with real homes across the UK.
          </p>
          
          {/* Visual indicator */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-1 bg-gradient-to-r from-teal-600 to-teal-800 rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              Hi there – we&apos;re the same friendly folks behind{' '}
              <a 
                href="https://www.ovendetailing.com" 
                className="text-teal-600 hover:text-teal-800 underline font-medium transition-colors duration-300" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                www.OvenDetailing.com
              </a>
              , a small, family-run oven cleaning business based in West Sussex.
            </p>

            <p>
              Over the years, we&apos;ve been asked again and again: <strong>&ldquo;Do you know a good cleaner?&rdquo;</strong> It turns out <em>a lot</em> of people are searching for help they can actually trust – and many great local cleaners are trying to find regular work without signing up to expensive apps or bidding against each other for jobs.
            </p>

            <p>
              So, we thought – why not build something simple that works for everyone?
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:transform hover:-translate-y-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                🎯
              </div>
              <h2 className="text-3xl font-bold text-teal-800">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              FindTrustedCleaners connects reliable local cleaners with everyday people who just want their homes looked after – without the fuss, subscription fees, or salesy nonsense.
            </p>
          </div>

          <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:transform hover:-translate-y-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                👨‍👩‍👧‍👦
              </div>
              <h2 className="text-3xl font-bold text-teal-800">Who We Are</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              We&apos;re not a faceless corporation. We&apos;re a small, family-run team from West Sussex trying to make life easier for cleaners and families alike.
            </p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              ⭐
            </div>
            <h2 className="text-3xl font-bold text-teal-800">Why People Choose Us</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "🔍", title: "Clarity", text: "See cleaner availability before you book." },
              { icon: "⚖️", title: "Fairness", text: "No crazy commission fees or hidden charges." },
              { icon: "🛡️", title: "Trust", text: "Only verified contact details are shared after booking." },
              { icon: "🤝", title: "Support", text: "Helping independent cleaners and families thrive." }
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{benefit.title}:</h3>
                  <p className="text-gray-700 leading-relaxed">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why We Built It */}
        <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              💡
            </div>
            <h2 className="text-3xl font-bold text-teal-800">Why We Built It</h2>
          </div>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              We know what it&apos;s like to juggle work, family, and cleaning. We also know what it&apos;s like to run a local service business, doing the graft and hoping the next job will come through.
            </p>

            <p>
              <strong>FindTrustedCleaners</strong> bridges that gap. It&apos;s a space where:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  ✓
                </div>
                <p className="text-gray-700">Cleaners don&apos;t have to pay to list or fight over leads.</p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  ✓
                </div>
                <p className="text-gray-700">Clients don&apos;t have to endlessly message or second guess who to trust.</p>
              </div>
            </div>

            <p className="text-center text-xl text-teal-700 font-medium italic">
              Just honest, real-time info – and real people behind it.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              📧
            </div>
            <h2 className="text-3xl font-bold text-teal-800">Get In Touch</h2>
          </div>
          
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Thanks for stopping by. Whether you&apos;re booking a cleaner or listing your services – we&apos;re genuinely glad you&apos;re here.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-lg">
            <Link href="/contact" className="text-teal-600 hover:text-teal-800 underline font-medium transition-colors duration-300">
              Visit our Contact Page
            </Link>
            <span className="text-gray-500 hidden sm:inline">or</span>
            <span className="text-gray-700">
              Email: <strong className="text-teal-700">hello@findtrustedcleaners.co.uk</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Glass Morphism Footer */}
      <footer className="bg-white/25 backdrop-blur-xl border-t border-white/20 shadow-lg">
        <div className="max-w-6xl mx-auto py-12 px-6">
          <nav className="flex flex-wrap justify-center gap-6 mb-8">
            {[
              { href: "/about", text: "About Us" },
              { href: "/terms", text: "Terms & Conditions" },
              { href: "/privacy-policy", text: "Privacy Policy" },
              { href: "/cookie-policy", text: "Cookie Policy" },
              { href: "/contact", text: "Contact" },
              { href: "/faq", text: "FAQs" },
              { href: "/sitemap", text: "Site Map" }
            ].map((link, index) => (
              <Link key={index} href={link.href} className="text-gray-700 hover:text-teal-600 transition-colors duration-300 font-medium">
                {link.text}
              </Link>
            ))}
          </nav>

          <div className="text-center">
            <p className="text-gray-700 mb-4 text-lg font-medium">
              &copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
            </p>

            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/30 inline-block">
              <p className="text-sm text-gray-600 max-w-2xl">
                FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
                <Link href="/privacy-policy" className="text-teal-600 hover:text-teal-800 underline font-medium">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/cookie-policy" className="text-teal-600 hover:text-teal-800 underline font-medium">
                  Cookie Policy
                </Link>{' '}
                for details on how we protect your data. You may{' '}
                <Link href="/contact" className="text-teal-600 hover:text-teal-800 underline font-medium">
                  contact us
                </Link>{' '}
                at any time to manage your personal information.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}