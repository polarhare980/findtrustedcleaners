import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <img src="/findtrusted-logo.png" alt="Find Trusted Cleaners" className="mb-4 h-auto w-40" />
            <p className="text-sm leading-6 text-slate-600">
              Find trusted local cleaners, compare real availability, and send booking requests without endless back-and-forth.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4">
            <FooterGroup title="Browse" links={[
              ['Find a cleaner', '/cleaners'],
              ['Cleaning services', '/services'],
              ['How it works', '/how-it-works'],
              ['About us', '/about'],
              ['Contact', '/contact'],
            ]} />
            <FooterGroup title="Popular locations" links={[
              ['West Sussex', '/locations/west-sussex'],
              ['Worthing', '/locations/worthing'],
              ['Lancing', '/locations/lancing'],
              ['Shoreham-by-Sea', '/locations/shoreham-by-sea'],
              ['Littlehampton', '/locations/littlehampton'],
            ]} />
            <FooterGroup title="Core services" links={[
              ['End of tenancy cleaning', '/services/end-of-tenancy-cleaning'],
              ['Deep cleaning', '/services/deep-cleaning'],
              ['Regular cleaning', '/services/regular-cleaning'],
              ['Oven cleaning', '/services/oven-cleaning'],
            ]} />
            <FooterGroup title="Account & legal" links={[
              ['Login', '/login'],
              ['Register as client', '/register/client'],
              ['Register as cleaner', '/register/cleaners'],
              ['Privacy policy', '/privacy-policy'],
              ['Cookie policy', '/cookie-policy'],
              ['Terms', '/terms'],
              ['Blog', '/blog'],
            ]} />
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }) {
  return (
    <div>
      <h3 className="mb-3 font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-slate-600 transition hover:text-teal-800">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
