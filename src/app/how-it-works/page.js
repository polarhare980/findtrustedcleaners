'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

const clientSteps = [
  'Browse cleaner profiles in your area.',
  'See availability, services, and profile details upfront.',
  'Request a suitable booking slot.',
  'Wait for the cleaner to approve before payment completes.',
];

const cleanerSteps = [
  'Create your profile and add your services.',
  'Set your working hours using the availability grid.',
  'Receive booking requests through your dashboard.',
  'Approve or decline requests before moving forward.',
];

export default function HowItWorks() {
  return (
    <main className="site-shell">
      <PublicHeader ctaHref="/register/cleaners" ctaLabel="For cleaners" />

      <PageHero
        eyebrow="How FindTrustedCleaners works"
        title="A clearer booking flow for clients and cleaners"
        description="FindTrustedCleaners is built to make the process simpler: clients can compare profiles first, and cleaners stay in control of approvals."
      />

      <section className="section-shell pb-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">For clients</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Find and request with more confidence</h2>
            <ol className="mt-6 space-y-4">
              {clientSteps.map((step, index) => (
                <li key={step} className="soft-panel flex gap-4 p-4 text-sm leading-6 text-slate-600">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 font-semibold text-white">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="surface-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">For cleaners</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Show your availability and manage requests</h2>
            <ol className="mt-6 space-y-4">
              {cleanerSteps.map((step, index) => (
                <li key={step} className="soft-panel flex gap-4 p-4 text-sm leading-6 text-slate-600">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section-shell py-8">
        <div className="surface-card p-8 text-center sm:p-10">
          <h2 className="text-3xl font-semibold text-slate-900">Ready to get started?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Whether you are looking for a cleaner or listing your services, the next step is straightforward.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/cleaners" className="brand-button">Find a cleaner</Link>
            <Link href="/register/cleaners" className="brand-button-secondary">Register as a cleaner</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
