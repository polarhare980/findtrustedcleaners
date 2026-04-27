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
        <div className="mb-8 rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Core local pages</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Browse these services in our lead coverage areas</h2>
          <p className="mt-3 max-w-3xl text-slate-600">We are building the strongest internal link loop around Worthing, Lancing, Shoreham-by-Sea and nearby towns so these service pages support local intent as well as wider UK searches.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/locations/west-sussex" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white">West Sussex</Link>
            <Link href="/locations/worthing" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white">Worthing</Link>
            <Link href="/locations/lancing" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white">Lancing</Link>
            <Link href="/locations/shoreham-by-sea" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white">Shoreham-by-Sea</Link>
            <Link href="/locations/littlehampton" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white">Littlehampton</Link>
            <Link href="/locations/angmering" className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white">Angmering</Link>
          </div>
        </div>

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
