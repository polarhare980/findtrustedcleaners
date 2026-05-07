import Link from 'next/link';
import { CORE_SERVICE_LINKS, SUPPORTING_GUIDES, WEST_SUSSEX_AREAS } from '@/lib/seo/regionalSeoData';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <img src="/findtrusted-logo.png" alt="Find Trusted Cleaners" className="mb-4 h-auto w-40" />
            <p className="text-sm leading-6 text-slate-600">Find trusted local cleaners, compare real availability, and send booking requests without endless back-and-forth.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/locations" className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-800">Location hub</Link>
              <Link href="/locations/west-sussex" className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">West Sussex hub</Link>
              <Link href="/services" className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-800">Service hub</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4 lg:grid-cols-5">
            <FooterGroup title="Browse" links={[["Find a cleaner", "/cleaners"], ["Cleaning services", "/services"], ["Locations", "/locations"], ["How it works", "/how-it-works"], ["About us", "/about"], ["Contact", "/contact"]]} />
            <FooterGroup title="Popular locations" links={WEST_SUSSEX_AREAS.slice(0, 8)} />
            <FooterGroup title="More West Sussex" links={WEST_SUSSEX_AREAS.slice(8, 13)} />
            <FooterGroup title="Core services" links={CORE_SERVICE_LINKS.slice(0, 8)} />
            <FooterGroup title="West Sussex guides" links={SUPPORTING_GUIDES.slice(0, 6)} />
          </div>
        </div>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Popular local searches</h3>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {[["Cleaners Worthing", "/locations/worthing"], ["Domestic cleaning Worthing", "/services/domestic-cleaning"], ["Window cleaning Littlehampton", "/services/window-cleaning"], ["Deep cleaning Crawley", "/services/deep-cleaning"], ["End of tenancy cleaning Chichester", "/services/end-of-tenancy-cleaning"], ["Cleaners West Sussex", "/locations/west-sussex"]].map(([label, href]) => <Link key={label} href={href} className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-800">{label}</Link>)}
          </div>
        </div>
        <div className="mt-8 grid gap-6 rounded-3xl border border-teal-100 bg-teal-50/60 p-5 md:grid-cols-2">
          <FooterGroup title="Crawley, Horsham & Bognor guides" links={SUPPORTING_GUIDES.slice(6, 16)} />
          <FooterGroup title="Useful links" links={[["Blog", "/blog"], ["Privacy policy", "/privacy-policy"], ["Cookie policy", "/cookie-policy"], ["Terms", "/terms"], ["Cleaner signup", "/register"], ["Find a cleaner", "/cleaners"]]} />
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">© {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }) {
  return <div><h3 className="mb-3 font-semibold text-slate-900">{title}</h3><ul className="space-y-2">{links.map(([label, href]) => <li key={`${label}-${href}`}><Link href={href} className="text-slate-600 transition hover:text-teal-800">{label}</Link></li>)}</ul></div>;
}
