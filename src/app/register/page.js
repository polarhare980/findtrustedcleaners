'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import PageHero from '@/components/PageHero';

function PremiumBenefits() {
  const benefits = [
    'Featured placement',
    'Higher visibility',
    'More enquiries',
    'Review highlighting',
    'Priority display',
  ];

  return (
    <section className="site-section pb-12">
      <div className="mx-auto max-w-5xl">
        <div className="surface-card p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Premium cleaners get</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Extra visibility without the hard sell
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Premium is designed to help stronger cleaner profiles stand out naturally while keeping the marketplace fair, clear, and useful for customers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-3xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/70 p-4 shadow-sm"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/10 text-lg text-teal-700">
                  ✓
                </div>
                <p className="text-sm font-semibold text-slate-900">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <PageHero
        eyebrow="Join the marketplace"
        title="Choose the right account to get started"
        description="Create a client account to book and manage appointments, or register as a cleaner to build your profile and start receiving enquiries."
      />

      <section className="site-section py-10">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="surface-card p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">For customers</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Register as a client</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Save your details, manage bookings, and make it easier to return when you need a trusted cleaner again.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              <li>• Faster checkout and booking management</li>
              <li>• Cleaner communication in one place</li>
              <li>• Better visibility over your appointments</li>
            </ul>
            <Link href="/register/client" className="ftc-button-primary mt-6 inline-flex">
              Continue as a client
            </Link>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">For cleaners</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Register as a cleaner</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Build your public profile, show live availability, and grow your visibility in a cleaner-first marketplace.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              <li>• Public profile with services and availability</li>
              <li>• Booking requests sent through the platform</li>
              <li>• Premium upgrade available when ready</li>
            </ul>
            <Link href="/register/cleaners" className="ftc-button-primary mt-6 inline-flex">
              Continue as a cleaner
            </Link>
          </div>
        </div>
      </section>

      <PremiumBenefits />
      <PublicFooter />
    </main>
  );
}
