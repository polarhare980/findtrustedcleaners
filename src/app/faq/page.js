'use client';

import Link from 'next/link';
import { useState } from 'react';

// ✅ SEO Meta Tags
export const metadata = {
  title: 'Frequently Asked Questions | FindTrustedCleaners',
  description: 'Get answers to the most common questions about FindTrustedCleaners, including booking, pricing, availability, and account management.',
  openGraph: {
    title: 'Frequently Asked Questions | FindTrustedCleaners',
    description: 'Answers to the most common questions about FindTrustedCleaners, including how to book, list yourself, manage availability, and more.',
    url: 'https://www.findtrustedcleaners.co.uk/faq',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.co.uk/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Frequently Asked Questions - FindTrustedCleaners',
      },
    ],
    type: 'website',
  },
};

export default function FAQPage() {
  const faqs = [
    {
      question: 'How do I book a cleaner?',
      answer: 'Browse local profiles, check their availability, and click "Request Booking." You\'ll be prompted to create a client account and pay a small one-time fee to unlock contact details.'
    },
    {
      question: 'How do I list myself as a cleaner?',
      answer: 'Click on "List Yourself" and fill out the short registration form. You can select your availability, services, and hourly rate.'
    },
    {
      question: 'Do I need to pay for a subscription?',
      answer: 'Nope. Clients pay a one-time fee to unlock cleaner contact info. Cleaners don\'t pay anything to appear in search results.'
    },
    {
      question: 'What does "Pending" mean on the cleaner\'s availability?',
      answer: 'Pending means a client has requested that time, but the cleaner hasn\'t confirmed yet. Cleaners can manage this in their dashboard.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. All data is encrypted and handled securely. We never sell your information to third parties.'
    },
    {
      question: 'Can I update my availability later?',
      answer: 'Yes. Cleaners can log in anytime to update or remove availability on their profile calendar grid.'
    },
    {
      question: 'How do I reset my password?',
      answer: 'Go to the login page and click "Forgot Password." Enter your email and follow the instructions to reset it securely.'
    },
    {
      question: 'What if no cleaners show up for my postcode?',
      answer: 'Try expanding your search radius or checking back soon—new cleaners are joining regularly!'
    },
    {
      question: 'Can I book the same cleaner regularly?',
      answer: 'Yes, once you have their contact info you can discuss recurring bookings directly with them.'
    },
    {
      question: 'Are cleaners verified?',
      answer: 'Yes. We vet cleaner profiles based on contact validity, service descriptions, and active availability. Reviews also help build trust.'
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <main className="min-h-screen bg-white text-gray-700">
      <header className="flex items-center justify-between px-6 py-4 bg-[#0D9488] text-white shadow">
        <Link href="/">
          <img src="/findtrusted-logo.png" alt="Logo" className="w-32 h-auto" />
        </Link>
        <nav className="space-x-6 text-sm font-medium">
          <Link href="/cleaners">Find a Cleaner</Link>
          <Link href="/register/cleaners">List Yourself</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/login">Login</Link>
          <Link href="/about">About</Link>
        </nav>
      </header>

      <section className="max-w-3xl mx-auto p-6 py-12">
        <h1 className="text-3xl font-bold text-[#0D9488] mb-8 text-center">Frequently Asked Questions</h1>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded p-4">
              <button
                className="w-full text-left font-semibold text-[#0D9488]"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {faq.question}
              </button>
              {openIndex === index && (
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#0D9488] text-white border-t py-6 px-6 text-center text-sm">
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
