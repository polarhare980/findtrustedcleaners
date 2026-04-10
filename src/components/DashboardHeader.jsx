'use client';

import Link from 'next/link';

export default function DashboardHeader({
  title = 'Dashboard',
  description = '',
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}) {
  return (
    <div className="surface-card mb-8 p-6 sm:p-8"> 
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"> 
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Find Trusted Cleaners</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 max-w-2xl text-slate-600">{description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {secondaryHref && secondaryLabel ? <Link href={secondaryHref} className="brand-button-secondary">{secondaryLabel}</Link> : null}
          {primaryHref && primaryLabel ? <Link href={primaryHref} className="brand-button">{primaryLabel}</Link> : null}
        </div>
      </div>
    </div>
  );
}
