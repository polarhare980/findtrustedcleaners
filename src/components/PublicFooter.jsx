import Link from 'next/link';

const LINKS = [
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/faq', label: 'FAQs' },
  { href: '/contact', label: 'Contact' },
  { href: '/sitemap', label: 'Site Map' },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <img src="/findtrusted-logo.png" alt="Find Trusted Cleaners" className="mb-4 h-10 w-auto" />
            <p className="text-sm leading-6 text-slate-600">
              FindTrustedCleaners helps clients compare local cleaners, view real availability, and request bookings with more clarity.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-600 sm:grid-cols-4">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-teal-700">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} FindTrustedCleaners. All rights reserved.</p>
          <p className="mt-2 max-w-4xl">
            FindTrustedCleaners is committed to GDPR compliance. Read our <Link href="/privacy-policy" className="underline">Privacy Policy</Link> and <Link href="/cookie-policy" className="underline">Cookie Policy</Link> for details on how we handle your data.
          </p>
        </div>
      </div>
    </footer>
  );
}
