import Link from 'next/link';
import CleanerProfile from './CleanerProfile';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

function isObjectIdLike(value = '') {
  return /^[a-f\d]{24}$/i.test(String(value || ''));
}

function titleCase(value = '') {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getLocationData(slug) {
  await connectToDatabase();

  const all = await Cleaner.find({})
    .select([
      'realName',
      'companyName',
      'rates',
      'services',
      'servicesDetailed',
      'image',
      'isPremium',
      'businessInsurance',
      'dbsChecked',
      'googleReviewRating',
      'googleReviewCount',
      'address',
      'availability',
    ].join(' '))
    .lean();

  const matched = (all || []).filter((cleaner) => {
    const town = slugify(cleaner?.address?.town || '');
    const county = slugify(cleaner?.address?.county || '');
    return town === slug || county === slug;
  });

  return matched.map((cleaner) => ({
    ...cleaner,
    _id: String(cleaner._id),
    servicesDetailed: Array.isArray(cleaner.servicesDetailed)
      ? cleaner.servicesDetailed.filter((s) => s?.active !== false)
      : [],
    services: Array.isArray(cleaner.services) ? cleaner.services : [],
  }));
}

function buildFaqs(locationName, cleaners = []) {
  const count = cleaners.length;
  const allServiceNames = Array.from(
    new Set(
      cleaners.flatMap((c) => [
        ...(c.services || []),
        ...((c.servicesDetailed || []).map((s) => s?.name).filter(Boolean)),
      ])
    )
  ).slice(0, 8);

  const hourlyRates = cleaners
    .map((c) => Number(c?.rates))
    .filter((n) => Number.isFinite(n) && n > 0);

  const fromRate = hourlyRates.length ? Math.min(...hourlyRates) : null;

  const vettedCount = cleaners.filter((c) => c?.dbsChecked || c?.businessInsurance).length;

  const availableToday = cleaners.filter((c) => {
    const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
    const day = c?.availability?.[todayName] || {};
    return Object.values(day).some((v) => v === true);
  }).length;

  return [
    {
      question: `How much does a cleaner cost in ${locationName}?`,
      answer:
        fromRate != null
          ? `Some cleaners in ${locationName} list hourly prices from £${fromRate}. Others price by service, so check each profile for fixed-price options.`
          : `Pricing in ${locationName} varies by cleaner and service type. Many cleaners use per-service pricing, so check each listing for the clearest quote.`,
    },
    {
      question: `How many cleaners are available in ${locationName}?`,
      answer: `Currently, there ${count === 1 ? 'is 1 cleaner' : `are ${count} cleaners`} listed in ${locationName} on Find Trusted Cleaners.`,
    },
    {
      question: `Can I book a cleaner in ${locationName} today?`,
      answer:
        availableToday > 0
          ? `Yes. ${availableToday} cleaner${availableToday === 1 ? '' : 's'} in ${locationName} currently show availability in their weekly schedule.`
          : `Possibly, but live availability changes quickly. Check the latest profile calendars for ${locationName} before sending a request.`,
    },
    {
      question: `Are cleaners in ${locationName} vetted?`,
      answer:
        vettedCount > 0
          ? `${vettedCount} cleaner${vettedCount === 1 ? '' : 's'} in ${locationName} currently show DBS or insurance information on their public profile.`
          : `Some cleaners add DBS and insurance details to their profile. Review each ${locationName} listing before booking.`,
    },
    {
      question: `What cleaning services are available in ${locationName}?`,
      answer:
        allServiceNames.length
          ? `Cleaners in ${locationName} currently offer services including ${allServiceNames.join(', ')}.`
          : `Service availability in ${locationName} depends on the cleaners currently listed. Open each profile to see what they cover.`,
    },
    {
      question: `How quickly can I find a cleaner in ${locationName}?`,
      answer: `You can browse ${locationName} cleaners straight away, compare services, and send a booking request from the platform.`,
    },
    {
      question: `Do cleaners bring their own supplies in ${locationName}?`,
      answer: `That depends on the cleaner and the service type. Ask the cleaner directly through their profile before confirming a job in ${locationName}.`,
    },
    {
      question: `How do I choose a cleaner in ${locationName}?`,
      answer: `Compare service lists, availability, reviews, and vetting details. Then choose the ${locationName} cleaner whose pricing and schedule best fit your job.`,
    },
  ];
}

function getNearbyLinks(locationSlug, cleaners = []) {
  const allSlugs = Array.from(
    new Set(
      cleaners
        .map((c) => slugify(c?.address?.town || c?.address?.county || ''))
        .filter(Boolean)
    )
  );

  return allSlugs.filter((s) => s && s !== locationSlug).slice(0, 6);
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const routeParam = decodeURIComponent(resolvedParams?.id || '');

  if (isObjectIdLike(routeParam)) {
    return {
      title: 'Cleaner Profile | Find Trusted Cleaners',
      description: 'View the profile, services, and availability of trusted cleaners near you.',
    };
  }

  const locationName = titleCase(routeParam);
  return {
    title: `Find Cleaners in ${locationName} | Find Trusted Cleaners`,
    description: `Browse trusted cleaners in ${locationName}, compare services, and check availability.`,
    robots: 'index,follow',
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const routeParam = decodeURIComponent(resolvedParams?.id || '');

  if (isObjectIdLike(routeParam)) {
    return <CleanerProfile />;
  }

  const locationSlug = slugify(routeParam);
  const locationName = titleCase(locationSlug);
  const cleaners = await getLocationData(locationSlug);

  if (!cleaners.length) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-teal-900 mb-4">
          No cleaners found in {locationName}
        </h1>
        <p className="text-slate-700">
          This location page is only published when real cleaner supply exists.
        </p>
      </main>
    );
  }

  const faqItems = buildFaqs(locationName, cleaners);
  const nearbyLinks = getNearbyLinks(locationSlug, cleaners);
  const shouldNoindex = cleaners.length < 2;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {shouldNoindex ? <meta name="robots" content="noindex,follow" /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-teal-900 mb-3">
          Find cleaners in {locationName}
        </h1>
        <p className="text-slate-700 max-w-3xl">
          Browse real cleaner supply in {locationName}. Compare services, pricing style,
          and weekly availability before sending a booking request.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
        {cleaners.map((cleaner) => (
          <article
            key={cleaner._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {cleaner.companyName || cleaner.realName}
                </h2>
                <p className="text-sm text-slate-500">
                  {cleaner.address?.town ||
                    cleaner.address?.county ||
                    cleaner.address?.postcode ||
                    'Location not set'}
                </p>
              </div>
              {cleaner.isPremium ? (
                <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-1">
                  Premium
                </span>
              ) : null}
            </div>

            {cleaner.rates ? (
              <p className="text-sm text-slate-700 mb-2">
                <strong>Hourly rate:</strong> £{cleaner.rates}
              </p>
            ) : null}

            {cleaner.servicesDetailed?.length ? (
              <ul className="text-sm text-slate-700 space-y-1 mb-4">
                {cleaner.servicesDetailed.slice(0, 4).map((svc) => (
                  <li key={svc.key || svc.name}>
                    {svc.name} · {svc.defaultDurationMins || 60} mins
                    {svc.price != null ? ` · £${svc.price}` : ''}
                  </li>
                ))}
              </ul>
            ) : null}

            <Link
              href={`/cleaners/${cleaner._id}`}
              className="inline-flex rounded-xl bg-teal-600 text-white px-4 py-2 font-medium"
            >
              View profile
            </Link>
          </article>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold text-teal-900 mb-4">
          Frequently Asked Questions About Cleaners in {locationName}
        </h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900 mb-2">{item.question}</h3>
              <p className="text-slate-700">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {nearbyLinks.length ? (
        <section>
          <h2 className="text-2xl font-bold text-teal-900 mb-4">Nearby areas</h2>
          <div className="flex flex-wrap gap-3">
            {nearbyLinks.map((slug) => (
              <Link
                key={slug}
                href={`/cleaners/${slug}`}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-700"
              >
                Also find cleaners in {titleCase(slug)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}