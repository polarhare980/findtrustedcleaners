import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { SERVICE_CATEGORIES } from '@/lib/serviceOptions';

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const metadata = {
  title: 'Cleaning Services | Find Trusted Cleaners',
  description: 'Browse cleaning services, compare cleaner profiles, and book trusted local help with live availability.',
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesIndexPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_32%),linear-gradient(135deg,#f8fffe_0%,#eefcf9_48%,#ffffff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-[32px] border border-white/70 bg-white/84 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Service hub</p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Cleaning services you can book through FindTrustedCleaners.com</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Browse service pages designed to support both UK-wide search intent and local location pages. Compare cleaner profiles, check live availability, and book with more confidence.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {Object.entries(SERVICE_CATEGORIES).map(([category, services]) => (
            <section key={category} className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <h2 className="mb-5 text-2xl font-bold tracking-tight text-teal-900">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <Link
                    key={service}
                    href={`/services/${slugify(service)}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800"
                  >
                    {service}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
