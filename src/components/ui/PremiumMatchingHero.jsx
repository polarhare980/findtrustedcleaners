'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const primaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-full bg-[#0C8FA3] px-7 py-4 text-base font-semibold text-white shadow-xl shadow-[#0C8FA3]/20 transition hover:-translate-y-0.5 hover:bg-[#087C8E]';

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
    <section
      className={cn(
        'relative isolate min-h-[92vh] overflow-hidden bg-[#020617] text-white',
        className
      )}
    >
      {/* HERO IMAGE */}
      <div className="absolute inset-0 -z-40">
        <Image
          src="/images/homepage-hero.jpg"
          alt="Luxury cleaner matching platform"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* DARK BMW STYLE OVERLAY */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-r from-[#020617]/95 via-[#020617]/78 to-[#020617]/10" />

      {/* DEPTH OVERLAY */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(12,143,163,0.18),transparent_42%)]" />

      {/* FLOATING GLASS BUBBLES */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[10%] h-32 w-32 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl animate-pulse" />
        <div className="absolute left-[18%] top-[55%] h-16 w-16 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl animate-pulse" />
        <div className="absolute left-[30%] top-[25%] h-24 w-24 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl animate-pulse" />
        <div className="absolute right-[12%] top-[20%] h-20 w-20 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl animate-pulse" />
        <div className="absolute right-[18%] bottom-[15%] h-28 w-28 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[92vh] w-full max-w-7xl items-center px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              Cleaner matching reimagined
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl md:text-7xl">
              Find trusted cleaners without the directory chaos
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Browse cleaner profiles by service, availability and location — from domestic cleaning to oven, carpet and window specialists.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {searchButton}

              <Link
                href={registerHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/10 px-7 py-4 text-base font-semibold text-white shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/18"
              >
                <UserRoundPlus className="h-5 w-5" />
                Register as cleaner
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#3DD9EB]" />
                Local cleaner discovery
              </span>

              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#3DD9EB]" />
                Trusted profiles
              </span>

              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#3DD9EB]" />
                Availability-led matching
              </span>

              {cleanerCount ? <span>{cleanerCount} cleaner profiles</span> : null}
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
