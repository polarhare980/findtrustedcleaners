import Link from 'next/link';
import { CORE_SERVICE_LINKS, SUPPORTING_GUIDES, WEST_SUSSEX_AREAS } from '@/lib/seo/regionalSeoData';

export default function RegionalSeoMesh({ locationName = 'West Sussex', compact = false }) {
  const areaLinks = WEST_SUSSEX_AREAS.slice(0, compact ? 8 : WEST_SUSSEX_AREAS.length);
  const serviceLinks = CORE_SERVICE_LINKS.slice(0, compact ? 6 : CORE_SERVICE_LINKS.length);
  const guideLinks = SUPPORTING_GUIDES.slice(0, compact ? 4 : SUPPORTING_GUIDES.length);
  return (
    <section className="site-section py-8">
      <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Regional SEO mesh</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Explore cleaners, services and guides across {locationName}</h2>
        <p className="mt-4 max-w-3xl text-slate-600">These links help visitors and search engines move between county pages, local town pages, core service pages and helpful cleaning guides.</p>
        <div className="mt-7 grid gap-6 lg:grid-cols-3">
          <LinkGroup title="Popular West Sussex areas" links={areaLinks} prefix="Cleaners in " />
          <LinkGroup title="Core cleaning services" links={serviceLinks} />
          <LinkGroup title="Useful cleaning guides" links={guideLinks} />
        </div>
      </div>
    </section>
  );
}
function LinkGroup({ title, links, prefix = '' }) {
  return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-bold text-slate-900">{title}</h3><div className="mt-4 flex flex-wrap gap-2">{links.map(([label, href]) => <Link key={href} href={href} className="rounded-full border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50">{prefix}{label}</Link>)}</div></div>;
}
