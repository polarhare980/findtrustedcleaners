'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PublicHeader() {
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (live && res.ok && data?.success) setViewer(data.user || null);
      } catch {}
    })();
    return () => { live = false; };
  }, []);

  const dashboardHref =
    viewer?.type === 'client'
      ? '/clients/dashboard'
      : viewer?.type === 'cleaner'
      ? '/cleaners/dashboard'
      : '/login';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-transform hover:scale-[1.02]"
        >
          <img
            src="/findtrusted-logo.png"
            alt="Find Trusted Cleaners"
            className="h-14 w-auto sm:h-16"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink href="/cleaners">Find a cleaner</NavLink>
          <NavLink href="/register/cleaners">List your business</NavLink>
          <NavLink href="/how-it-works">How it works</NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/register/client"
            className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 sm:inline-flex"
          >
            Register
          </Link>

          <Link
            href={dashboardHref}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            {viewer ? 'Dashboard' : 'Login'}
          </Link>
        </div>

      </div>
    </header>
  );
}

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-teal-800"
    >
      {children}
    </Link>
  );
}