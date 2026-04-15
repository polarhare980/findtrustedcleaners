import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import CleanerProfile from '@/app/cleaners/[id]/CleanerProfile';
import { buildServiceMarket } from '@/lib/serviceMarketplace';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.findtrustedcleaners.com';

const CORE_LOCATIONS = {
  worthing: {
    name: 'Worthing',
    nearby: ['Lancing', 'Shoreham-by-Sea', 'Littlehampton', 'Angmering', 'Rustington'],
    intro:
      'FindTrustedCleaners.com helps you find cleaners in Worthing without the usual back-and-forth. You can check cleaner profiles, see live availability, and book cleaners near you for the jobs that matter most.',
  },
  lancing: {
    name: 'Lancing',
    nearby: ['Worthing', 'Shoreham-by-Sea', 'Littlehampton', 'Angmering'],
    intro:
      'If you need cleaners in Lancing, FindTrustedCleaners.com makes the process simpler. Compare local cleaner profiles, see who is available, and book cleaners near you without waiting around for quotes.',
  },
  'shoreham-by-sea': {
    name: 'Shoreham-by-Sea',
    nearby: ['Lancing', 'Worthing', 'Littlehampton', 'Angmering', 'Chichester'],
    intro:
      'Looking for cleaners in Shoreham-by-Sea? FindTrustedCleaners.com lets you view cleaner profiles instantly, check real-time availability, and book cleaners near you in a faster, clearer way.',
  },
  littlehampton: {
    name: 'Littlehampton',
    nearby: ['Angmering', 'Rustington', 'Worthing', 'Bognor Regis'],
    intro:
      'Looking for cleaners in Littlehampton? FindTrustedCleaners.com helps you compare local cleaner profiles, check real-time availability, and book with less delay when you need reliable domestic help.',
  },
  angmering: {
    name: 'Angmering',
    nearby: ['Rustington', 'Littlehampton', 'Worthing', 'Lancing'],
    intro:
      'If you need cleaners in Angmering, FindTrustedCleaners.com gives you a simpler way to compare trusted local options, view availability, and move straight to booking without the usual quote chasing.',
  },
  rustington: {
    name: 'Rustington',
    nearby: ['Littlehampton', 'Angmering', 'Worthing', 'Bognor Regis'],
    intro:
      'FindTrustedCleaners.com makes it easier to find cleaners in Rustington, compare local profiles, and book with confidence when you want clear availability and a more direct route to trusted help.',
  },
  'bognor-regis': {
    name: 'Bognor Regis',
    nearby: ['Chichester', 'Littlehampton', 'Rustington', 'Worthing'],
    intro:
      'Searching for cleaners in Bognor Regis? FindTrustedCleaners.com helps you check profiles, compare services, and book cleaners near you with live availability shown up front.',
  },
  chichester: {
    name: 'Chichester',
    nearby: ['Bognor Regis', 'Shoreham-by-Sea', 'Littlehampton', 'Worthing'],
    intro:
      'FindTrustedCleaners.com helps you find cleaners in Chichester with a clearer booking journey, giving you local profiles, real-time availability, and a faster way to compare trusted providers.',
  },
};

const CORE_SERVICE_LINKS = [
  { href: '/services/end-of-tenancy-cleaning', label: 'End of tenancy cleaning' },
  { href: '/services/deep-cleaning', label: 'Deep cleaning' },
  { href: '/services/regular-cleaning', label: 'Regular cleaning' },
  { href: '/services/oven-cleaning', label: 'Oven cleaning' },
];

const SERVICE_SECTIONS = [
  {
    key: 'end-of-tenancy-cleaning',
    title: 'End of tenancy cleaning',
    searchLabel: 'End of Tenancy',
    description: (locationName) =>
      `If you need end of tenancy cleaning in ${locationName}, you can compare local cleaners who handle full-property cleans before a move-out, handover, or tenancy check. It is a practical way to find reliable help quickly without chasing multiple companies for separate quotes.`,
  },
  {
    key: 'deep-cleaning',
    title: 'Deep cleaning',
    searchLabel: 'Deep Cleaning',
    description: (locationName) =>
      `Deep cleaning in ${locationName} is ideal when your home needs more than a routine tidy-up. From kitchens and bathrooms to neglected high-touch areas, local cleaners can list one-off deep cleaning services clearly on their profile so you can compare the right fit.`,
  },
  {
    key: 'regular-cleaning',
    title: 'Regular domestic cleaning',
    searchLabel: 'Domestic Cleaning',
    description: (locationName) =>
      `For regular domestic cleaning in ${locationName}, FindTrustedCleaners.com helps you browse house cleaners who suit your schedule. Whether you need weekly help, fortnightly visits, or ongoing support around work and family life, you can view availability before you book.`,
  },
  {
    key: 'oven-cleaning',
    title: 'Oven cleaning',
    searchLabel: 'Oven Cleaning',
    description: (locationName) =>
      `Oven cleaning in ${locationName} is also covered, making it easier to find specialist help for one of the jobs people often put off. You can compare local cleaners and specialists who offer oven cleaning alongside broader household services.`,
  },
];

const EXTRA_SERVICES = [
  'Spring Cleaning',
  'After-party Cleaning',
  'Holiday Let Cleaning',
  'Specialist Cleaning',
  'Carpet Cleaning',
  'Upholstery Cleaning',
  'Mattress Cleaning',
  'Curtain Cleaning',
  'Mould Removal',
  'Window Cleaning',
  'Gutter Cleaning',
  'Roof Cleaning',
  'Pressure Washing',
  'Car Valeting',
  'Fleet Cleaning',
  'Office Cleaning',
  'Retail Cleaning',
  'Gym Cleaning',
];

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

function toDisplayLocation(slug) {
  return CORE_LOCATIONS[slug]?.name || titleCase(slug);
}

const ALL_LOCATION_SLUGS = Object.keys(CORE_LOCATIONS);

function getLocationConfig(slug) {
  const displayName = toDisplayLocation(slug);
  const fallbackNearby = ALL_LOCATION_SLUGS
    .filter((placeSlug) => placeSlug !== slug)
    .slice(0, 5)
    .map((placeSlug) => CORE_LOCATIONS[placeSlug]?.name || titleCase(placeSlug));

  return {
    name: displayName,
    nearby: CORE_LOCATIONS[slug]?.nearby || fallbackNearby,
    intro:
      CORE_LOCATIONS[slug]?.intro ||
      `FindTrustedCleaners.com helps you compare cleaners in ${displayName}, view profiles instantly, and book cleaners near you without waiting around for quotes.`,
  };
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
      question: `How much do cleaners cost in ${locationName}?`,
      answer:
        fromRate != null
          ? `Some cleaners in ${locationName} list prices from £${fromRate} per hour, while others price by service. The easiest way to compare costs is to view each cleaner profile and check what is included.`
          : `Cleaner pricing in ${locationName} depends on the service, property size, and whether the job is regular or one-off. Profiles on FindTrustedCleaners.com help you compare options more clearly before booking.`,
    },
    {
      question: 'Can I book a cleaner the same day?',
      answer:
        availableToday > 0
          ? `Yes, same-day bookings may be possible when cleaners show open slots in their live availability. At the moment, ${availableToday} cleaner${availableToday === 1 ? '' : 's'} in ${locationName} currently show availability today.`
          : `Possibly. Availability changes throughout the week, so the best approach is to check live cleaner calendars for ${locationName} and book as soon as you see a suitable slot.`,
    },
    {
      question: `Are cleaners in ${locationName} vetted?`,
      answer:
        vettedCount > 0
          ? `Some are. ${vettedCount} cleaner${vettedCount === 1 ? '' : 's'} in ${locationName} currently show DBS or insurance details on their public profile, helping you make a more informed choice.`
          : `Cleaner profiles can show details such as reviews, insurance, and service information. It is always worth checking the individual profile before you book.`,
    },
    {
      question: 'Do I need to get quotes?',
      answer:
        'No. One of the main benefits of FindTrustedCleaners.com is that you can view cleaner profiles, services, and availability directly instead of waiting for multiple quotes to come back.',
    },
    {
      question: `What types of cleaning can I book in ${locationName}?`,
      answer:
        `You can find support for regular domestic cleaning, deep cleaning, end of tenancy cleaning, oven cleaning, and a wider range of specialist services depending on the cleaners currently listed in ${locationName}.`,
    },
    {
      question: `How do I choose a reliable cleaner in ${locationName}?`,
      answer:
        `Compare cleaner profiles carefully, including availability, reviews, services, and any vetting details shown. That gives you a clearer picture than a basic directory listing alone.`,
    },
  ];
}

function getNearbyLinks(locationSlug) {
  const configuredNearby = (CORE_LOCATIONS[locationSlug]?.nearby || [])
    .map((place) => slugify(place))
    .filter((slug) => slug && slug !== locationSlug);

  const fallbackNearby = ALL_LOCATION_SLUGS.filter((slug) => slug !== locationSlug);

  return Array.from(new Set([...configuredNearby, ...fallbackNearby])).slice(0, 5);
}

function getCleanerServiceHighlights(cleaners = []) {
  const names = Array.from(
    new Set(
      cleaners.flatMap((c) => [
        ...(c.services || []),
        ...((c.servicesDetailed || []).map((s) => s?.name).filter(Boolean)),
      ])
    )
  );

  return names.slice(0, 12);
}


export function generateStaticParams() {
  return ALL_LOCATION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const routeParam = decodeURIComponent(resolvedParams?.slug || '');

  if (isObjectIdLike(routeParam)) {
    return {
      title: 'Cleaner Profile | Find Trusted Cleaners',
      description: 'View the profile, services, and availability of trusted cleaners near you.',
    };
  }

  const locationSlug = slugify(routeParam);
  const locationName = toDisplayLocation(locationSlug);

  return {
    title: `Find Trusted Cleaners in ${locationName}`,
    description: `Find trusted cleaners in ${locationName}. View live availability, compare local profiles, and book online without waiting for quotes.`,
    alternates: {
      canonical: `/locations/${locationSlug}`,
    },
    robots: 'index,follow',
  };
}

function formatLocationServiceIntro(locationName) {
  return `Popular cleaning services in ${locationName} include end of tenancy cleaning, deep cleaning, regular cleaning and oven cleaning. You can explore each service page to compare what is available before choosing a cleaner.`;
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const routeParam = decodeURIComponent(resolvedParams?.slug || '');

  if (isObjectIdLike(routeParam)) {
    return <CleanerProfile />;
  }

  const locationSlug = slugify(routeParam);
  const location = getLocationConfig(locationSlug);
  const locationName = location.name;
  const cleaners = await getLocationData(locationSlug);
  const faqItems = buildFaqs(locationName, cleaners);
  const serviceMarket = buildServiceMarket(cleaners, 10);
  const nearbyLinks = getNearbyLinks(locationSlug);
  const serviceHighlights = getCleanerServiceHighlights(cleaners);

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

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Find Trusted Cleaners ${locationName}`,
    url: `${SITE_URL}/locations/${locationSlug}`,
    image: `${SITE_URL}/og-image.jpg`,
    areaServed: [
      locationName,
      ...location.nearby,
    ].map((place) => ({
      '@type': 'City',
      name: place,
    })),
    brand: {
      '@type': 'Brand',
      name: 'FindTrustedCleaners.com',
    },
    serviceType: [
      'End of tenancy cleaning',
      'Deep cleaning',
      'Regular domestic cleaning',
      'Oven cleaning',
    ],
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <header className="mb-8 rounded-3xl border border-teal-100 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Local cleaners with availability
        </p>
        <h1 className="mb-4 text-4xl font-bold text-teal-900">
          Find Trusted Cleaners in {locationName}
        </h1>
        <p className="max-w-3xl text-slate-700">
          {location.intro}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/cleaners?postcode=${encodeURIComponent(locationName)}`}
            className="inline-flex rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
          >
            View available cleaners
          </Link>
          <Link
            href={`/cleaners?postcode=${encodeURIComponent(locationName)}`}
            className="inline-flex rounded-xl border border-teal-200 bg-white px-5 py-3 font-semibold text-teal-700"
          >
            Book instantly
          </Link>
        </div>
      </header>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-teal-900">Why choose FindTrustedCleaners.com in {locationName}?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Real-time cleaner availability</h3>
            <p className="text-slate-700">See which local cleaners in {locationName} are actually available before you enquire, helping you move faster when you need domestic cleaning, deep cleaning, or end of tenancy cleaning.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">No waiting for quotes</h3>
            <p className="text-slate-700">Instead of filling out forms and waiting around, you can compare cleaners directly and choose the right fit for your property, schedule, and budget.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Transparent cleaner profiles</h3>
            <p className="text-slate-700">Profiles make it easier to compare services, ratings, prices, and availability. That means fewer surprises and a clearer path to booking cleaners near you.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Local trusted cleaners</h3>
            <p className="text-slate-700">Whether you are in {locationName} itself or nearby, the platform helps connect you with local cleaners who cover the surrounding area and show their services clearly.</p>
          </div>
        </div>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-teal-900">Cleaning services available in {locationName}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICE_SECTIONS.map((service) => (
            <div key={service.key} className="rounded-2xl border border-slate-200 p-5">
              <h3 className="mb-2 text-xl font-semibold text-slate-900">{service.title}</h3>
              <p className="mb-4 text-slate-700">{service.description(locationName)}</p>
              <Link
                href={`/services/${service.key}`}
                className="font-medium text-teal-700 underline underline-offset-4"
              >
                Learn more about {service.title.toLowerCase()}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <h3 className="mb-2 text-lg font-semibold text-slate-900">More services listed by cleaners on the platform</h3>
          <p className="text-slate-700">
            Depending on the cleaner, you may also find services such as {EXTRA_SERVICES.join(', ')}.
            {serviceHighlights.length
              ? ` Current cleaner profiles in ${locationName} also mention ${serviceHighlights.join(', ')}.`
              : ''}
          </p>
        </div>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-teal-900">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: '1. Search your area',
              text: `Start with ${locationName} and look for cleaners covering your postcode or nearby streets.`,
            },
            {
              title: '2. View cleaner availability',
              text: 'Check live availability, compare profiles, and see which cleaners match your timing and service needs.',
            },
            {
              title: '3. Book instantly',
              text: 'Choose the cleaner that fits and move ahead without the usual delay of quote chasing.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl bg-slate-50 p-5">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="text-slate-700">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-teal-900">Local cleaning coverage around {locationName}</h2>
        <p className="text-slate-700">
          This page is designed for people searching for reliable cleaners in {locationName}, but it also supports nearby demand across {location.nearby.join(', ')}. That local relevance matters when you want affordable cleaning services nearby and need to see local cleaners with availability rather than broad, generic directory listings.
        </p>
        <p className="mt-4 text-slate-700">
          You can also browse nearby location pages for{' '}
          {nearbyLinks.map((slug, index) => (
            <span key={slug}>
              <Link href={`/locations/${slug}`} className="text-teal-700 underline underline-offset-4">
                {toDisplayLocation(slug)}
              </Link>
              {index < nearbyLinks.length - 2 ? ', ' : index === nearbyLinks.length - 2 ? ' and ' : ''}
            </span>
          ))}.
        </p>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-teal-900">Popular cleaning services in {locationName}</h2>
        <p className="text-slate-700">{formatLocationServiceIntro(locationName)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {CORE_SERVICE_LINKS.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white"
            >
              {service.label}
            </Link>
          ))}
        </div>
      </section>

      {cleaners.length ? (
        <section className="mb-10">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Live marketplace listings</p>
              <h2 className="text-2xl font-bold text-teal-900">Cleaner profiles currently visible in {locationName}</h2>
            </div>
            <Link
              href={`/cleaners?postcode=${encodeURIComponent(locationName)}`}
              className="inline-flex rounded-xl border border-teal-200 bg-white px-4 py-2 font-medium text-teal-700"
            >
              View available cleaners
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cleaners.map((cleaner) => (
              <article
                key={cleaner._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {cleaner.companyName || cleaner.realName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {cleaner.address?.town ||
                        cleaner.address?.county ||
                        cleaner.address?.postcode ||
                        'Location not set'}
                    </p>
                  </div>
                  {cleaner.isPremium ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                      Premium
                    </span>
                  ) : null}
                </div>

                {cleaner.rates ? (
                  <p className="mb-2 text-sm text-slate-700">
                    <strong>Hourly rate:</strong> £{cleaner.rates}
                  </p>
                ) : null}

                {cleaner.servicesDetailed?.length ? (
                  <ul className="mb-4 space-y-1 text-sm text-slate-700">
                    {cleaner.servicesDetailed.slice(0, 4).map((svc) => (
                      <li key={svc.key || svc.name}>
                        {svc.name}
                        {svc.price != null ? ` · £${svc.price}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Link
                  href={`/cleaners/${cleaner._id}`}
                  className="inline-flex rounded-xl bg-teal-600 px-4 py-2 font-medium text-white"
                >
                  View profile
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {serviceMarket.length ? (
        <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Popular local service options</p>
              <h2 className="text-2xl font-bold text-teal-900">Quick compare cards for {locationName}</h2>
            </div>
            <Link
              href="/blog/how-to-hire-a-cleaner"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-teal-700"
            >
              Read our cleaner hiring guide
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {serviceMarket.map((service) => (
              <Link
                key={service.key}
                href={`/cleaners?postcode=${encodeURIComponent(locationName)}&service=${encodeURIComponent(service.label)}`}
                className="min-w-[240px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  {service.cleanerCount} cleaner{service.cleanerCount === 1 ? '' : 's'}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{service.label}</h3>
                <div className="mt-4 text-3xl font-bold text-slate-900">
                  {service.minPrice != null ? `£${service.minPrice}` : 'Profile pricing'}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {service.minPrice != null ? 'from listed profile prices' : 'check cleaner profile for pricing'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-teal-900">Frequently asked questions about cleaners in {locationName}</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-2 font-semibold text-slate-900">{item.question}</h3>
              <p className="text-slate-700">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {nearbyLinks.length ? (
        <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-teal-900">Explore nearby areas</h2>
          <div className="flex flex-wrap gap-3">
            {nearbyLinks.map((slug) => (
              <Link
                key={slug}
                href={`/locations/${slug}`}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-700"
              >
                Cleaners in {toDisplayLocation(slug)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-teal-100 bg-teal-50 p-8 shadow-sm">
        <h2 className="mb-3 text-2xl font-bold text-teal-900">Ready to book a cleaner in {locationName}?</h2>
        <p className="max-w-3xl text-slate-700">
          Skip the waiting, compare local cleaner profiles, and use FindTrustedCleaners.com to move straight to the next step with more confidence.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/cleaners?postcode=${encodeURIComponent(locationName)}`}
            className="inline-flex rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white"
          >
            View available cleaners
          </Link>
          <Link
            href={`/cleaners?postcode=${encodeURIComponent(locationName)}`}
            className="inline-flex rounded-xl border border-teal-200 bg-white px-5 py-3 font-semibold text-teal-700"
          >
            Book instantly
          </Link>
        </div>
      </section>
    </main>
  );
}
