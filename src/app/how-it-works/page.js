'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function HowItWorks() {
  return (
    <>
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
              <Link href="/how-it-works" className="text-teal-700 font-semibold">How It Works</Link>
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

        {/* Hero Section */}
        <section className="px-6 py-16 max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-600 mb-8">
            <div className="bg-white/30 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 inline-flex items-center gap-2">
              <Link href="/" className="hover:text-teal-600 transition-colors duration-300">Home</Link> 
              <span className="text-teal-600">→</span>
              <span className="text-teal-700 font-medium">How It Works</span>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              How It Works
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
              Whether you are looking to book a trusted cleaner or list your own services, here is exactly how FindTrustedCleaners makes the process simple, transparent, and local.
            </p>
            
            {/* Visual indicator */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-1 bg-gradient-to-r from-teal-600 to-teal-800 rounded-full"></div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Clients Section */}
            <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:transform hover:-translate-y-2 group">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  👥
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-teal-800 mb-2">For Clients</h2>
                  <p className="text-gray-600">Find and book trusted cleaners</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: 1, icon: "🔍", text: "Browse local cleaners for free", color: "from-blue-500 to-blue-600" },
                  { step: 2, icon: "⭐", text: "See available hours, ratings, and pricing", color: "from-purple-500 to-purple-600" },
                  { step: 3, icon: "📅", text: "Request a time slot with your chosen cleaner", color: "from-green-500 to-green-600" },
                  { step: 4, icon: "💳", text: "No payment is taken until the cleaner approves your request", color: "from-amber-500 to-amber-600" },
                  { step: 5, icon: "🔓", text: "Once approved, you complete the payment and unlock the cleaner's verified contact information", color: "from-teal-500 to-teal-600" },
                  { step: 6, icon: "🛡️", text: "Requested slots are marked to prevent double booking", color: "from-red-500 to-red-600" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/50 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="text-gray-800 font-medium leading-relaxed">{item.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cleaners Section */}
            <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:transform hover:-translate-y-2 group">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  🧹
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-teal-800 mb-2">For Cleaners</h2>
                  <p className="text-gray-600">List your services and get bookings</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: 1, icon: "📝", text: "Register your cleaning business for free", color: "from-blue-500 to-blue-600" },
                  { step: 2, icon: "🕐", text: "Select your working hours using an easy grid system", color: "from-purple-500 to-purple-600" },
                  { step: 3, icon: "🔒", text: "Your availability is visible to clients but your contact information remains protected until booking confirmation", color: "from-green-500 to-green-600" },
                  { step: 4, icon: "📲", text: "Receive booking requests and approve or decline them via your dashboard", color: "from-amber-500 to-amber-600" },
                  { step: 5, icon: "💰", text: "Payment is only completed once you approve a request, then your contact details are shared", color: "from-teal-500 to-teal-600" },
                  { step: 6, icon: "📊", text: "Keep your availability up to date to avoid double bookings", color: "from-red-500 to-red-600" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/50 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="text-gray-800 font-medium leading-relaxed">{item.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white/25 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
            <h3 className="text-3xl font-bold text-teal-800 mb-4">Ready to Get Started?</h3>
            <p className="text-gray-700 mb-8 text-lg">Join thousands of satisfied clients and cleaners on our platform</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register/client" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:scale-105">
                🙋‍♀️ Register as a Client
              </Link>
              <Link href="/register/cleaner" className="bg-white/80 backdrop-blur-md text-teal-700 border-2 border-teal-600 px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-teal-700 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:scale-105">
                🧽 Register as a Cleaner
              </Link>
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
    </>
  );
}
