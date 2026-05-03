import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export const metadata = {
  title: 'About Us | FindTrustedCleaners',
  description:
    'Learn about the family-run team behind FindTrustedCleaners and why we built a clearer, fairer way to connect households with trusted local cleaners.',
  keywords:
    'About FindTrustedCleaners, family-run cleaning platform, trusted local cleaners, UK cleaner marketplace',
  openGraph: {
    title: 'About Us | FindTrustedCleaners',
    description:
      'Family-run and practical, FindTrustedCleaners was built to make it easier for households to find trusted local cleaners and for cleaners to be discovered fairly.',
    url: 'https://www.findtrustedcleaners.com/about',
    siteName: 'FindTrustedCleaners',
    images: [
      {
        url: 'https://www.findtrustedcleaners.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FindTrustedCleaners About Us',
      },
    ],
    type: 'website',
  },
  alternates: {
    canonical: '/about',
  },
  robots: { index: true, follow: true },
};

const values = [
  {
    title: 'Built around clarity',
    text: 'We want people to see useful information quickly, compare real options, and feel confident before they book.',
  },
  {
    title: 'Fair for cleaners',
    text: 'Independent cleaners should be able to present their work properly without feeling pushed into a hard-sell marketplace.',
  },
  {
    title: 'Practical for households',
    text: 'Cleaner profiles, visible details, and live availability help reduce the back-and-forth that usually slows everything down.',
  },
  {
    title: 'Rooted in real service work',
    text: 'This was created by people who understand local service businesses, not by a faceless company trying to overcomplicate things.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />

      <section className="site-section py-8">
        <nav className="mb-8 text-sm text-slate-500">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <Link href="/" className="transition-colors hover:text-teal-700">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900">About Us</span>
          </div>
        </nav>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-r from-teal-50 via-white to-slate-50 px-6 py-12 sm:px-10">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                About FindTrustedCleaners
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                A cleaner marketplace built to feel straightforward, useful, and fair.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                We created FindTrustedCleaners to help households find reliable local cleaners more easily, and to give cleaners a better way to be discovered without the usual noise.
              </p>
            </div>
          </div>

          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6 text-base leading-8 text-slate-600 sm:text-lg">
              <p>
                We are the same family-run team behind{' '}
                <a
                  href="https://www.ovendetailing.com"
                  className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-4 transition-colors hover:text-teal-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Oven Detailing
                </a>
                , a local service business based in West Sussex.
              </p>

              <p>
                Over time, one question kept coming up: do you know a good cleaner? That simple question showed us the same gap again and again. People wanted trustworthy help at home, while good local cleaners needed a better way to show what they offer and when they are available.
              </p>

              <p>
                So we built something designed to be clearer from both sides. Households can browse real cleaner profiles, compare options, and check availability. Cleaners can present themselves properly without being squeezed into an overly aggressive lead-selling model.
              </p>

              <p>
                The aim is not to overcomplicate a simple service. It is to make the process feel more transparent, more respectful, and easier to trust.
              </p>
            </div>

            <div className="surface-muted p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                What matters to us
              </p>
              <div className="mt-6 space-y-4">
                {values.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section pb-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Why we built it</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Less friction for both sides.</h2>
            <div className="mt-5 space-y-4 text-slate-600">
              <p>Clients should not have to second guess who to trust or spend ages chasing replies.</p>
              <p>Cleaners should not have to fight through confusing platforms just to win regular work.</p>
              <p>We built FindTrustedCleaners to sit in the middle with a calmer, more practical approach.</p>
            </div>
          </div>

          <div className="surface-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Get in touch</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Questions, feedback, or support.</h2>
            <p className="mt-5 text-slate-600">
              If you need help with the platform or want to contact the team, use the contact page or email us directly.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/contact" className="ftc-button-primary">
                Visit the contact page
              </Link>
              <a
                href="mailto:findtrustedcleaners@gmail.com"
                className="ftc-button-secondary"
              >
                findtrustedcleaners@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
