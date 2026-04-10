'use client';

import Link from 'next/link';

const LINKS = [
  { href: '/cleaners', label: 'Find a Cleaner' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/register/cleaners', label: 'For Cleaners' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog', label: 'Blog' },
];

export default function PublicHeader({ ctaHref = '/login', ctaLabel = 'Login' }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/findtrusted-logo.png"
            alt="Find Trusted Cleaners"
            className="h-10 w-auto"
          />
          <span className="hidden text-sm font-semibold tracking-tight text-slate-900 sm:inline">
            FindTrustedCleaners
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-teal-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/register/client"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:inline-flex"
          >
            Register as Client
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
