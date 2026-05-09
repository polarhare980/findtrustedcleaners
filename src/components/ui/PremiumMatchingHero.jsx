'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from 'lucide-react';

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
      {/* HERO VIDEO */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover object-center"
        >
          <source src="/videos/homepage-hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* DARK BMW STYLE OVERLAY */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#020617]/95 via-[#020617]/75 to-[#020617]/15" />

      {/* DEPTH OVERLAY */}
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_top_left,rgba(12,143,163,0.18),transparent_42%)]" />

      {/* Bubble layer removed while testing hero video playback */}

      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-[92vh] w-full max-w-7xl items-center px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              Trusted local cleaners
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl md:text-7xl">
              Find trusted cleaners
            </h1>

            <p className="mt-6 max-w-2xl text-2xl font-medium leading-8 text-slate-200 sm:text-3xl">
              Sparkling homes.
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
