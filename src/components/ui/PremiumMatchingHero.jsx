'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, Search, ShieldCheck, Sparkles, UserRoundPlus } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}


export default function PremiumMatchingHero({
  className,
  searchHref = '/cleaners',
  registerHref = '/register/cleaners',
  onSearchClick,
  cleanerCount,
}) {
  const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-full bg-[#0C8FA3] px-7 py-4 text-base font-semibold text-white shadow-xl shadow-[#0C8FA3]/20 transition hover:-translate-y-0.5 hover:bg-[#087C8E]';

  const searchButton = onSearchClick ? (
    <button type="button" onClick={onSearchClick} className={primaryButtonClass}>
      <Search className="h-5 w-5" />
      Search cleaners
    </button>
  ) : (
    <Link href={searchHref} className={primaryButtonClass}>
      <Search className="h-5 w-5" />
      Search cleaners
    </Link>
  );

  return (
    <section className={cn('relative isolate min-h-[88vh] overflow-hidden bg-[#f7fbfa] text-slate-950', className)}>
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef9f8_38%,#dff0ee_100%)]" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(105deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.68)_44%,rgba(255,255,255,0.2)_100%)]" />
      <div className="absolute right-[-16%] top-[6%] -z-10 h-[540px] w-[540px] rounded-full bg-[#21B6C7]/24 blur-3xl" />
      <div className="absolute bottom-[-18%] left-[-10%] -z-10 h-[440px] w-[440px] rounded-full bg-[#BCEFF0]/55 blur-3xl" />
      <div className="absolute right-[8%] top-[20%] -z-10 hidden h-[360px] w-[360px] rounded-full border border-white/60 bg-white/28 shadow-[0_30px_120px_rgba(12,143,163,0.18)] backdrop-blur-2xl lg:block" />

      <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-7xl items-center px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid w-full gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-semibold text-[#076D7E] shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              Local cleaners, real availability
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-6xl md:text-7xl">
              Find trusted cleaners who are actually available
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              A calmer way to find a cleaner. Search by service and availability, then move through matched cleaner profiles without the usual directory overload.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {searchButton}
              <Link
                href={registerHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0C8FA3]/22 bg-white/62 px-7 py-4 text-base font-semibold text-[#075B6A] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/88"
              >
                <UserRoundPlus className="h-5 w-5" />
                Register as cleaner
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#0C8FA3]" />West Sussex first</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0C8FA3]" />Reviewed profiles</span>
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-[#0C8FA3]" />Availability-led matching</span>
              {cleanerCount ? <span>{cleanerCount} cleaner profiles</span> : null}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-[44px] bg-white/26 blur-2xl" />
            <div className="relative overflow-hidden rounded-[42px] border border-white/70 bg-white/62 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
              <div className="rounded-[32px] bg-[linear-gradient(160deg,#071D3A_0%,#0C8FA3_52%,#ECFEFF_100%)] p-5 text-white shadow-inner">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-50">Matched cleaner</p>
                  <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold backdrop-blur">Next available</span>
                </div>

                <div className="mt-24 rounded-[28px] border border-white/24 bg-white/16 p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-2xl font-bold">✓</div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">Trusted local cleaner</h2>
                      <p className="mt-1 text-sm text-cyan-50">Domestic, deep cleaning and end of tenancy</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/14 p-3"><strong className="block text-lg">4.9</strong>reviews</div>
                    <div className="rounded-2xl bg-white/14 p-3"><strong className="block text-lg">Today</strong>slots</div>
                    <div className="rounded-2xl bg-white/14 p-3"><strong className="block text-lg">£</strong>from price</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm font-semibold text-slate-700">
                <div className="rounded-2xl bg-white/72 p-4">Swipe-style browsing</div>
                <div className="rounded-2xl bg-white/72 p-4">Cleaner approval</div>
                <div className="rounded-2xl bg-white/72 p-4">Simple request flow</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
