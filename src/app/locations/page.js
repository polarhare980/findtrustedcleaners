import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import RegionalSeoMesh from '@/components/seo/RegionalSeoMesh';
import AuthorityTrustPanel from '@/components/seo/AuthorityTrustPanel';
import JsonLd from '@/components/seo/JsonLd';
import { COUNTY_HUBS, WEST_SUSSEX_AREAS, buildBreadcrumbSchema } from '@/lib/seo/regionalSeoData';

export const metadata = {
  title: 'Cleaning Service Areas | Find Trusted Cleaners',
  description: 'Browse FindTrustedCleaners.com service areas, starting with West Sussex cleaning companies, local cleaners and cleaning service pages.',
  alternates: { canonical: '/locations' },
  robots: 'index,follow',
};

export default function LocationsHubPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([{ name: 'Home', href: '/' }, { name: 'Locations', href: '/locations' }]);
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />
      <JsonLd data={breadcrumbSchema} />
      <section className="site-section pt-10 pb-8">
        <div className="rounded-[34px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">County-level cleaning hubs</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Find cleaners by area</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Start with the strongest regional hub before expanding outwards. West Sussex is the current priority area, with East Sussex held back until the content, cleaner coverage and internal links are ready.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">{COUNTY_HUBS.map((county) => <div key={county.slug} className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold text-slate-900">{county.name}</h2><p className="mt-3 text-slate-600">{county.summary}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${county.status === 'active' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>{county.status}</span></div>{county.status === 'active' ? <Link href={county.href} className="mt-5 inline-flex rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white">Open {county.name} hub</Link> : <p className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">Planned next. Keep no thin county pages indexed until enough local content exists.</p>}</div>)}</div>
        </div>
      </section>
      <section className="site-section py-8"><div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"><h2 className="text-3xl font-bold text-slate-900">West Sussex town coverage</h2><p className="mt-4 max-w-3xl text-slate-600">These are the priority town pages feeding authority into the West Sussex county hub and core service pages.</p><div className="mt-6 flex flex-wrap gap-3">{WEST_SUSSEX_AREAS.map(([label, href]) => <Link key={href} href={href} className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white">Cleaners in {label}</Link>)}</div></div></section>
      <RegionalSeoMesh locationName="West Sussex" />
      <AuthorityTrustPanel />
      <PublicFooter />
    </main>
  );
}
