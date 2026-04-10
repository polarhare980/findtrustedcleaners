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

  const dashboardHref = viewer?.type === 'client'
    ? '/clients/dashboard'
    : viewer?.type === 'cleaner'
      ? '/cleaners/dashboard'
      : '/login';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 transition-transform duration-200 hover:scale-[1.02]">
          <img src="/findtrusted-logo.png" alt="Find Trusted Cleaners" className="h-auto w-36 sm:w-40" />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <NavLink href="/cleaners">Find a cleaner</NavLink>
          <NavLink href="/how-it-works">How it works</NavLink>
          <NavLink href="/register/client">Register as a client</NavLink>
          <NavLink href="/register/cleaners">List your business</NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={dashboardHref} className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 sm:inline-flex">
            {viewer ? 'Dashboard' : 'Login'}
          </Link>
          <Link href="/cleaners" className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800">
            Search now
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }) {
  return (
    <Link href={href} className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-teal-800">
      {children}
    </Link>
  );
}
