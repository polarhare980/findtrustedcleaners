'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import { useState } from 'react';

const FAQS = [
  {
    question: 'How does FindTrustedCleaners work?',
    answer:
      'You can browse cleaner profiles, compare services, check live availability and send a booking request when you find a good fit. The platform is designed to keep things simple, transparent and easy to trust.',
  },
  {
    question: 'Do I need an account to look at cleaner profiles?',
    answer:
      'No. Public profiles can be viewed without signing in. An account is only needed when you want to manage bookings, purchases or account activity.',
  },
  {
    question: 'How do booking requests work?',
    answer:
      'A client chooses a cleaner and sends a request for a suitable slot. That request is then shown to the cleaner for approval, which helps reduce double-booking and keeps availability more accurate.',
  },
  {
    question: 'What does pending mean on availability?',
    answer:
      'Pending means a time slot has been requested but has not yet been accepted by the cleaner. Once the cleaner responds, the slot will either be confirmed or reopened.',
  },
  {
    question: 'How do cleaners join the platform?',
    answer:
      'Cleaners can register, add their business details, select services, set availability and build out their profile. Premium upgrades are optional, but every cleaner starts with a public presence on the marketplace.',
  },
  {
    question: 'Can cleaners update their details later?',
    answer:
      'Yes. Cleaners can update profile information, trust signals, services, pricing, photos and availability from the dashboard at any time.',
  },
  {
    question: 'Are cleaners vetted?',
    answer:
      'Profiles can display useful trust signals such as insurance, DBS status, reviews, service information and availability. Clients can use those details to compare cleaners more confidently.',
  },
  {
    question: 'How are reviews handled?',
    answer:
      'Cleaner profiles can show review ratings publicly, and review content is used to help future clients make better decisions. This gives good cleaners stronger social proof over time.',
  },
  {
    question: 'What if I cannot find a cleaner in my area?',
    answer:
      'Try broadening your search slightly or check back later. New cleaners are added over time, and coverage improves as more businesses join the platform.',
  },
  {
    question: 'How do I get support?',
    answer:
      'Use the contact page and send a message with as much detail as possible. That gives us the best chance of helping quickly and accurately.',
  },
];

export default function FAQComponent() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 text-slate-800">
      <div className="absolute inset-0 -z-10">
        <img src="/background.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.14),transparent_42%),linear-gradient(180deg,rgba(248,250,252,0.90),rgba(240,253,250,0.85),rgba(248,250,252,0.96))]" />
      </div>

      <PublicHeader />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-white/78 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="border-b border-white/60 bg-[linear-gradient(135deg,rgba(13,148,136,0.10),rgba(255,255,255,0.78),rgba(45,212,191,0.08))] px-6 py-10 md:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Help and support</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Frequently asked questions</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
              Straight answers about bookings, cleaner profiles, reviews, trust signals and how the marketplace works.
            </p>
          </div>

          <div className="grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="rounded-[28px] border border-teal-100 bg-teal-50/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <h2 className="text-lg font-semibold text-slate-900">Need something specific?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start with the questions below. If you still need help, use the contact page and send a short message with the issue you are seeing.
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  href="/register/cleaners"
                  className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800"
                >
                  Join as a cleaner
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5 hover:from-teal-700 hover:to-teal-800"
                >
                  Contact support
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>

            <div className="space-y-4">
              {FAQS.map((faq, index) => {
                const open = openIndex === index;
                return (
                  <div
                    key={faq.question}
                    className={`overflow-hidden rounded-[28px] border transition-all duration-300 ${
                      open
                        ? 'border-teal-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]'
                        : 'border-white/70 bg-white/72 hover:border-teal-100 hover:bg-white/88'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                    >
                      <span className="text-base font-semibold text-slate-900 md:text-lg">{faq.question}</span>
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm transition ${
                          open
                            ? 'border-teal-200 bg-teal-50 text-teal-700'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        {open ? '−' : '+'}
                      </span>
                    </button>

                    {open ? (
                      <div className="px-5 pb-5 md:px-6 md:pb-6">
                        <div className="border-t border-slate-100 pt-4 text-sm leading-7 text-slate-600 md:text-[15px]">
                          {faq.answer}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
