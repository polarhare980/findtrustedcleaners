'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function FAQComponent() {
  const faqs = [
    {
      question: 'How do I book a cleaner?',
      answer:
        'Browse local profiles, check their availability, and click "Request Booking." You\'ll be prompted to create a client account and pay a small one-time fee to unlock contact details.',
    },
    {
      question: 'How do I list myself as a cleaner?',
      answer:
        'Click on "List Yourself" and fill out the short registration form. You can select your availability, services, and hourly rate.',
    },
    {
      question: 'Do I need to pay for a subscription?',
      answer:
        "Nope. Clients pay a one-time fee to unlock cleaner contact info. Cleaners don't pay anything to appear in search results.",
    },
    {
      question: 'What does "Pending" mean on the cleaner\'s availability?',
      answer:
        "Pending means a client has requested that time, but the cleaner hasn't confirmed yet. Cleaners can manage this in their dashboard.",
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes. All data is encrypted and handled securely. We never sell your information to third parties.',
    },
    {
      question: 'Can I update my availability later?',
      answer:
        'Yes. Cleaners can log in anytime to update or remove availability on their profile calendar grid.',
    },
    {
      question: 'How do I reset my password?',
      answer:
        'Go to the login page and click "Forgot Password." Enter your email and follow the instructions to reset it securely.',
    },
    {
      question: 'What if no cleaners show up for my postcode?',
      answer:
        'Try expanding your search radius or checking back soon—new cleaners are joining regularly!',
    },
    {
      question: 'Can I book the same cleaner regularly?',
      answer:
        'Yes, once you have their contact info you can discuss recurring bookings directly with them.',
    },
    {
      question: 'Are cleaners verified?',
      answer:
        'Yes. We vet cleaner profiles based on contact validity, service descriptions, and active availability. Reviews also help build trust.',
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url("/cleaning-bg.jpg")',
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-teal-700/10"></div>

      {/* Header */}
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative z-10 max-w-4xl mx-auto p-6 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Find answers to common questions about our cleaning service platform
          </p>
        </div>

        {/* FAQ Cards */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group backdrop-blur-md bg-white/25 border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <button
                className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 rounded-2xl"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <div className={`transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6 animate-slide-down">
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center">
          <div className="backdrop-blur-md bg-white/25 border border-white/20 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-teal-800 mb-4">Still have questions?</h2>
            <p className="text-gray-700 mb-6">We're here to help! Get in touch with our support team.</p>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium rounded-full hover:from-teal-700 hover:to-teal-800 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
              </Link>{' '}
              and{' '}
              <Link href="/cookie-policy" className="underline hover:text-teal-300 transition-colors duration-300">
                Cookie Policy
              </Link>{' '}
              for details on how we protect your data. You may{' '}
              <Link href="/contact" className="underline hover:text-teal-300 transition-colors duration-300">
                contact us
              </Link>{' '}
              at any time to manage your personal information.
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

        @keyframes slide-down {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 200px;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out both;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
