"use client";

import Link from "next/link";

export default function SiteMapPage() {
  const siteStructure = [
    {
      category: "Main Pages",
      links: [
        { href: "/", label: "Home" },
        { href: "/about", label: "About Us" },
        { href: "/cleaners", label: "Find a Cleaner" },
        { href: "/how-it-works", label: "How It Works" },
        { href: "/contact", label: "Contact" },
      ],
    },
    {
      category: "Authentication",
      links: [
        { href: "/login", label: "Login" },
        { href: "/register", label: "Register (Cleaner)" },
        { href: "/register/client", label: "Register (Client)" },
      ],
    },
    {
      category: "Support & Information",
      links: [
        { href: "/faq", label: "FAQ" },
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/privacy-policy", label: "Privacy Policy" },
        { href: "/cookie-policy", label: "Cookie Policy" },
        { href: "/sitemap", label: "Site Map" },
      ],
    },
  ];

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("/cleaning-bg.jpg")' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-teal-700/10"></div>

      <header className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="transition-transform duration-300 hover:scale-105">
            <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
          </Link>
          <nav className="space-x-6 text-sm font-medium text-white">
            <Link href="/cleaners" className="hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300">
              Find a Cleaner
            </Link>
            <Link href="/register/cleaners" className="hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300">
              List Yourself
            </Link>
            <Link href="/how-it-works" className="hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300">
              How It Works
            </Link>
            <Link href="/login" className="hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300">
              Login
            </Link>
            <Link href="/about" className="hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300">
              About
            </Link>
            <Link href="/faq" className="hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300">
              FAQ
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 max-w-4xl mx-auto p-6 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
            Site Map
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Navigate our cleaning service platform with ease
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {siteStructure.map((section, index) => (
            <div
              key={index}
              className="backdrop-blur-md bg-white/25 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <h2 className="text-xl font-bold text-teal-800 mb-4 flex items-center">
                <div className="w-2 h-2 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full mr-3"></div>
                {section.category}
              </h2>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="group flex items-center text-gray-700 hover:text-teal-600 transition-all duration-300 p-2 rounded-lg hover:bg-white/20"
                    >
                      <div className="w-1 h-1 bg-teal-600 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></div>
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-2xl p-8 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-teal-800 mb-4">Quick Navigation</h2>
            <p className="text-gray-700 mb-6">Jump to the most popular sections of our platform</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/cleaners" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium rounded-full hover:from-teal-700 hover:to-teal-800 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                🔍 Find Cleaners
              </Link>
              <Link href="/register" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-full hover:from-green-600 hover:to-green-700 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                ✨ Join as Cleaner
              </Link>
              <Link href="/how-it-works" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-full hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                📖 How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 backdrop-blur-md bg-teal-900/80 border-t border-white/20 py-8 px-6 text-white">
        <div className="max-w-6xl mx-auto">
          <nav className="flex flex-wrap justify-center gap-6 mb-6">
            <Link href="/about" className="hover:text-teal-300 transition-colors duration-300">
              About Us
            </Link>
            <Link href="/terms" className="hover:text-teal-300 transition-colors duration-300">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="hover:text-teal-300 transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy" className="hover:text-teal-300 transition-colors duration-300">
              Cookie Policy
            </Link>
            <Link href="/contact" className="hover:text-teal-300 transition-colors duration-300">
              Contact
            </Link>
            <Link href="/faq" className="hover:text-teal-300 transition-colors duration-300">
              FAQs
            </Link>
            <Link href="/sitemap" className="hover:text-teal-300 transition-colors duration-300">
              Site Map
            </Link>
          </nav>

          <div className="text-center">
            <p className="mb-4 text-teal-100">&copy; {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>
            <p className="text-sm text-teal-200 max-w-4xl mx-auto">
              FindTrustedCleaners is committed to GDPR compliance. Read our{' '}
              <Link href="/privacy-policy" className="underline hover:text-teal-300 transition-colors duration-300">
                Privacy Policy
              </Link>{' '}and{' '}
              <Link href="/cookie-policy" className="underline hover:text-teal-300 transition-colors duration-300">
                Cookie Policy
              </Link>{' '}for details on how we protect your data. You may{' '}
              <Link href="/contact" className="underline hover:text-teal-300 transition-colors duration-300">
                contact us
              </Link>{' '}at any time to manage your personal information.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out both;
        }
      `}</style>
    </main>
  );
}
