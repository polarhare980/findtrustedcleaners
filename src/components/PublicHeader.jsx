'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function PublicHeader() {
  const [viewer, setViewer] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (live && res.ok && data?.success) setViewer(data.user || null);
      } catch {}
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const dashboardHref =
    viewer?.type === 'client'
      ? '/clients/dashboard'
      : viewer?.type === 'cleaner'
        ? '/cleaners/dashboard'
        : '/login';

  const menuLinks = useMemo(
    () => [
      { href: '/', label: 'Home' },
      { href: '/cleaners', label: 'Find a cleaner' },
      { href: '/register/cleaners', label: 'List your business' },
      { href: '/register/client', label: 'Register as client' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/blog', label: 'Blog' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
      { href: dashboardHref, label: viewer ? 'Dashboard' : 'Login' },
    ],
    [dashboardHref, viewer]
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
          <img src="/findtrusted-logo.png" alt="Find Trusted Cleaners" className="h-12 w-auto sm:h-14" />
        </Link>

        <div ref={menuRef} className="relative flex items-center">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-label="Open menu"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-2xl border border-teal-100 bg-white/85 p-3 text-slate-700 shadow-[0_10px_24px_rgba(13,148,136,0.12)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800"
          >
            <span className="sr-only">Menu</span>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>

          {isOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(88vw,320px)] overflow-hidden rounded-[28px] border border-white/70 bg-white/92 p-3 shadow-[0_22px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
              <div className="mb-2 px-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">FindTrustedCleaners</p>
                <p className="mt-1 text-sm text-slate-500">Everything in one place.</p>
              </div>

              <nav className="grid gap-1">
                {menuLinks.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-800"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
