'use client';

import Link from 'next/link';
import { useState } from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

export default function FAQComponent() {
  const faqs = [
    {
      question: 'How do I book a cleaner?',
      answer: 'Browse local profiles, check availability, and request a booking. You will be asked to create a client account so the cleaner can receive and manage your request.',
    },
    {
      question: 'How do I list myself as a cleaner?',
      answer: 'Select “For Cleaners” or the cleaner registration page, then complete the registration form with your services and availability.',
    },
    {
      question: 'Do I need to pay for a subscription?',
      answer: 'Cleaner profiles are public. Clients only need an account if they want to send booking requests through the platform.',
    },
    {
      question: 'What does pending mean on availability?',
      answer: 'Pending means a client has requested that time, but the cleaner has not confirmed it yet.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Your data is handled through the platform’s account and privacy flows. For more detail, see the privacy policy.',
    },
    {
      question: 'Can cleaners update availability later?',
      answer: 'Yes. Cleaners can sign in and update availability from their dashboard whenever needed.',
    },
    {
      question: 'How do I reset my password?',
      answer: 'Visit the login page and use the password reset option to start the reset process.',
    },
    {
      question: 'What if no cleaners appear for my postcode?',
      answer: 'Try broadening your search or check back later as new cleaners continue to join the platform.',
    },
  ];

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <main className="site-shell">
      <PublicHeader ctaHref="/contact" ctaLabel="Contact us" />
      <PageHero
        eyebrow="Help and answers"
        title="Frequently asked questions"
        description="Answers to common questions about finding cleaners, creating accounts, and using the booking process."
      />

      <section className="section-shell pb-16">
        <div className="mx-auto max-w-4xl space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="surface-card overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                type="button"
              >
                <span className="text-lg font-semibold text-slate-900">{faq.question}</span>
                <span className="text-2xl text-teal-700">{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index ? (
                <div className="border-t border-slate-200 px-6 py-5 text-sm leading-7 text-slate-600">{faq.answer}</div>
              ) : null}
            </div>
          ))}

          <div className="surface-card p-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Still need help?</h2>
            <p className="mt-3 text-slate-600">If you cannot find the answer here, get in touch and we will point you in the right direction.</p>
            <div className="mt-6">
              <Link href="/contact" className="brand-button">Contact support</Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
