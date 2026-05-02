import Link from 'next/link';

export const metadata = {
  title: 'Best Cleaners Littlehampton | FindTrustedCleaners.com',
  description: 'A placeholder guide for people comparing the best cleaners in Littlehampton.',
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">
          Littlehampton cleaning placeholder
        </p>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Best Cleaners Littlehampton</h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          A placeholder guide for people comparing the best cleaners in Littlehampton. This page has been added as a safe SEO placeholder so the URL exists, can be linked internally, and can be expanded into a full landing page later.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-2xl font-semibold">Target keyword</h2>
          <p className="mt-3 text-slate-200">Primary phrase: <strong>best cleaners Littlehampton</strong></p>
          <p className="mt-3 text-slate-300">
            Future copy should include local relevance, trust signals, pricing guidance where useful, and links to cleaner profiles when there are active Littlehampton listings.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Internal links to keep</h2>
            <ul className="mt-4 space-y-2 text-teal-200 underline-offset-4 hover:[&_a]:underline">
              <li><Link href="/locations/littlehampton">Cleaners in Littlehampton</Link></li>
              <li><Link href="/services/window-cleaning/littlehampton">Window cleaning Littlehampton</Link></li>
              <li><Link href="/services/domestic-cleaning/littlehampton">Domestic cleaner Littlehampton</Link></li>
              <li><Link href="/services/deep-cleaning/littlehampton">Deep cleaning Littlehampton</Link></li>
              <li><Link href="/services/end-of-tenancy-cleaning/littlehampton">End of tenancy cleaning Littlehampton</Link></li>
              <li><Link href="/blog/cleaners-littlehampton-prices">Cleaner prices Littlehampton</Link></li>
              <li><Link href="/blog/best-cleaners-littlehampton">Best cleaners Littlehampton</Link></li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Content to add later</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
              <li>Short intro explaining the service in Littlehampton.</li>
              <li>What customers usually need help with.</li>
              <li>Price guidance or booking advice where relevant.</li>
              <li>CTA linking to available local cleaner profiles.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
