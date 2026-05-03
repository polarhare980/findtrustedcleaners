import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { ALL_SERVICE_OPTIONS, SERVICE_CATEGORIES } from '@/lib/serviceOptions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.findtrustedcleaners.com';

const CORE_LOCATION_LINKS = [
  { href: '/locations/worthing', label: 'Worthing' },
  { href: '/locations/littlehampton', label: 'Littlehampton' },
  { href: '/locations/bognor-regis', label: 'Bognor Regis' },
  { href: '/locations/chichester', label: 'Chichester' },
  { href: '/locations/crawley', label: 'Crawley' },
  { href: '/locations/horsham', label: 'Horsham' },
  { href: '/locations/lancing', label: 'Lancing' },
  { href: '/locations/shoreham-by-sea', label: 'Shoreham-by-Sea' },
  { href: '/locations/rustington', label: 'Rustington' },
  { href: '/locations/angmering', label: 'Angmering' },
  { href: '/locations/haywards-heath', label: 'Haywards Heath' },
  { href: '/locations/east-grinstead', label: 'East Grinstead' },
  { href: '/locations/burgess-hill', label: 'Burgess Hill' },
];

const SERVICE_ALIASES = {
  'regular-cleaning': 'Regular House Cleaning',
  'regular-house-cleaning': 'Regular House Cleaning',
  'deep-cleaning': 'Deep Cleaning',
  'spring-cleaning': 'Spring Cleaning',
  'end-of-tenancy': 'End of Tenancy',
  'end-of-tenancy-cleaning': 'End of Tenancy',
  'after-party-cleaning': 'After-party Cleaning',
  'holiday-let-cleaning': 'Holiday Let Cleaning',
  'oven-cleaning': 'Oven Cleaning',
  'carpet-cleaning': 'Carpet Cleaning',
  'upholstery-cleaning': 'Upholstery Cleaning',
  'mattress-cleaning': 'Mattress Cleaning',
  'curtain-cleaning': 'Curtain Cleaning',
  'mould-removal': 'Mould Removal',
  'window-cleaning': 'Window Cleaning',
  'gutter-cleaning': 'Gutter Cleaning',
  'roof-cleaning': 'Roof Cleaning',
  'pressure-washing': 'Pressure Washing',
  'car-valeting': 'Car Valeting',
  'fleet-cleaning': 'Fleet Cleaning',
  'office-cleaning': 'Office Cleaning',
  'retail-cleaning': 'Retail Cleaning',
  'gym-cleaning': 'Gym Cleaning',
};

const BLOG_LINKS = {
  'End of Tenancy': [
    { href: '/blog/end-of-tenancy-cleaning-checklist', label: 'End of tenancy cleaning checklist' },
    { href: '/blog/how-to-hire-a-cleaner', label: 'How to hire a cleaner' },
  ],
  default: [{ href: '/blog/how-to-hire-a-cleaner', label: 'How to hire a cleaner' }],
};

const SERVICE_COPY = {
  'End of Tenancy': {
    intro:
      'Looking for end of tenancy cleaning near me? FindTrustedCleaners.com helps you compare professional end of tenancy cleaning services across the UK, check real-time availability, and book instantly without waiting around for quotes.',
    included: [
      'Full property clean including kitchens, bathrooms, living spaces, bedrooms, and key touchpoints.',
      'Attention to areas that are commonly checked during move-out inspections, including surfaces, skirting boards, floors, and fittings.',
      'Cleaner profiles that clearly show availability, service details, and useful trust signals before you book.',
      'A faster route to booking local end of tenancy cleaning services when timing matters and handover dates are close.',
    ],
    cleanerProvides: [
      'One-off move-out or pre-handover cleaning for flats, houses, and rental properties.',
      'Optional add-ons depending on the cleaner, such as oven cleaning, carpet cleaning, or deeper kitchen and bathroom work.',
      'Flexible weekday and weekend slots where availability is shown on the cleaner profile.',
    ],
    faqs: [
      ['How much does end of tenancy cleaning cost in the UK?', 'Prices vary based on property size, condition, and whether extras such as oven or carpet cleaning are needed. The quickest way to compare is to view cleaner profiles and check what each service includes.'],
      ['Can I book same-day end of tenancy cleaning?', 'Sometimes, yes. Same-day end of tenancy cleaning depends on cleaner availability in your area, so it is worth checking live booking slots as early as possible.'],
      ['What does end of tenancy cleaning include?', 'It usually includes a detailed clean of the kitchen, bathrooms, bedrooms, living areas, floors, and surfaces, with some cleaners also offering extras such as oven or carpet cleaning.'],
      ['How long does end of tenancy cleaning take?', 'That depends on the property size, layout, and overall condition. Smaller properties can be quicker, while larger or more heavily used homes may take considerably longer.'],
      ['Can I view the cleaner before booking?', 'Yes. FindTrustedCleaners.com lets you view cleaner profiles, services, and availability before you book.'],
    ],
  },
  'Deep Cleaning': {
    intro:
      'Need deep cleaning near me? FindTrustedCleaners.com makes it easier to find professional deep cleaning services in the UK, compare local providers, and book instantly based on real-time availability.',
    included: [
      'A more thorough clean than a standard weekly visit, with extra focus on neglected, high-touch, or hard-to-reach areas.',
      'Extra attention to kitchens, bathrooms, floors, surfaces, fixtures, and detail work throughout the home.',
      'Cleaner profiles that help you compare availability, trust signals, and service coverage before making a booking.',
      'A practical way to book affordable deep cleaning without waiting for multiple quotes to come back.',
    ],
    cleanerProvides: [
      'One-off deep cleans for homes that need a reset before guests, after renovations, or as part of a seasonal clean.',
      'Tailored cleaning depending on the property condition and the cleaner\'s listed services.',
      'Optional add-ons such as oven, carpet, or upholstery cleaning where available.',
    ],
    faqs: [
      ['How much does deep cleaning cost in the UK?', 'Deep cleaning prices vary depending on the size of the property, the level of dirt build-up, and any extras included. Cleaner profiles help you compare options before booking.'],
      ['Can I book same-day deep cleaning?', 'Sometimes. Same-day deep cleaning depends on the cleaner\'s live availability and the size of the job.'],
      ['What does deep cleaning include?', 'Deep cleaning usually covers kitchens, bathrooms, floors, surfaces, skirting boards, touchpoints, and areas that may not be covered in a routine clean.'],
      ['How long does deep cleaning take?', 'It depends on the size and condition of the property. A one-bedroom flat will usually take less time than a family home needing a full reset.'],
      ['Is deep cleaning different from regular cleaning?', 'Yes. Deep cleaning is usually a more detailed one-off service, while regular cleaning focuses on keeping a home tidy and maintained over time.'],
    ],
  },
  'Regular House Cleaning': {
    intro:
      'Searching for regular house cleaning near me? FindTrustedCleaners.com helps you find professional regular cleaning services across the UK, view cleaner profiles, and book local help instantly based on live availability.',
    included: [
      'Ongoing home cleaning support for weekly, fortnightly, or routine visits that fit around your schedule.',
      'Cleaner profiles that show availability, trust signals, and service details before you commit.',
      'A simpler way to compare local regular cleaning services without back-and-forth quote chasing.',
      'Clear booking journeys designed to help you move from search to confirmed cleaner faster.',
    ],
    cleanerProvides: [
      'Routine home cleaning for living spaces, kitchens, bathrooms, bedrooms, and general upkeep.',
      'Flexible recurring availability where the cleaner has calendar space available.',
      'Optional extras depending on the cleaner, such as ironing, deep cleaning add-ons, or specific room priorities.',
    ],
    faqs: [
      ['How much does regular house cleaning cost in the UK?', 'Costs vary by cleaner, location, frequency, and property size. You can compare cleaner profiles to see what is available in your area.'],
      ['Can I book same-day regular house cleaning?', 'In some areas, yes. Same-day bookings depend on live availability and whether the cleaner offers short-notice visits.'],
      ['What does regular house cleaning include?', 'Regular house cleaning usually covers routine upkeep such as dusting, vacuuming, wiping surfaces, and cleaning kitchens and bathrooms.'],
      ['How long does regular house cleaning take?', 'The time depends on property size, visit frequency, and the number of rooms being cleaned.'],
      ['Can I choose the cleaner before booking?', 'Yes. You can view cleaner profiles first, which makes it easier to choose the right fit for your home and schedule.'],
    ],
  },
  'Oven Cleaning': {
    intro:
      'Looking for oven cleaning near me? FindTrustedCleaners.com helps you find professional oven cleaning services in the UK, compare local providers, and book instantly when availability suits you.',
    included: [
      'A specialist cleaning option for one of the most commonly delayed jobs in the home.',
      'Cleaner profiles that make it easier to compare service details, trust signals, and live availability.',
      'A faster way to book local oven cleaning services without waiting for a callback or quote.',
      'Support for people who want trusted oven cleaning providers with clearer booking visibility.',
    ],
    cleanerProvides: [
      'Cleaning for standard ovens, built-in units, or other oven types where the cleaner lists this service.',
      'Optional add-ons, depending on the provider, such as hobs, extractor areas, or broader kitchen cleaning.',
      'One-off appointments for homeowners, tenants, landlords, and holiday lets.',
    ],
    faqs: [
      ['How much does oven cleaning cost in the UK?', 'Oven cleaning prices vary based on oven type, size, and the level of build-up. Some cleaners may also price extra items separately.'],
      ['Can I book same-day oven cleaning?', 'Sometimes. Same-day oven cleaning depends on local availability and appointment length.'],
      ['What does oven cleaning include?', 'That varies by cleaner, but it usually focuses on the oven interior, removable parts, and the main areas that collect grease and burnt-on residue.'],
      ['How long does oven cleaning take?', 'It depends on the oven size, type, and condition. Heavier build-up usually increases the time needed.'],
      ['Can I compare oven cleaning providers before booking?', 'Yes. Profiles help you compare availability and decide who looks right for the job before you book.'],
    ],
  },

  'Window Cleaning': {
    intro:
      'Looking for window cleaning near me? FindTrustedCleaners.com helps you compare window cleaning services across West Sussex, check local availability, and find cleaners for exterior windows, conservatories, frames, sills and related exterior cleaning work.',
    included: [
      'Exterior window cleaning for homes, flats, rental properties and small businesses where listed by the cleaner.',
      'Regular or one-off window cleaning options depending on local cleaner availability.',
      'Useful add-ons such as frames, sills, conservatory glass, gutter cleaning, fascia cleaning or pressure washing where offered.',
      'Cleaner profiles that make it easier to compare availability, service details and trust signals before booking.',
    ],
    cleanerProvides: [
      'Traditional window cleaning or water-fed pole cleaning depending on the cleaner\'s method and access requirements.',
      'Window cleaning appointments scheduled around the cleaner\'s listed availability.',
      'Optional exterior cleaning services such as gutters, fascias, soffits and pressure washing where available.',
    ],
    faqs: [
      ['How much does window cleaning cost in West Sussex?', 'Window cleaning prices vary based on property size, number of windows, access, frequency and whether extras such as conservatory glass, frames or sills are included.'],
      ['Can I book regular window cleaning?', 'Yes, where cleaners list recurring availability. Some may offer monthly, six-weekly or one-off window cleaning depending on their route and schedule.'],
      ['Do window cleaners clean frames and sills?', 'Some do, but it depends on the cleaner and the service listed on their profile. Check the service details before booking.'],
      ['Can I combine window cleaning with gutter cleaning?', 'Often yes. Many exterior cleaners offer related services such as gutter cleaning, fascia cleaning or pressure washing, depending on equipment and availability.'],
      ['Can I compare window cleaners before booking?', 'Yes. You can view cleaner profiles, check availability and compare service details before choosing who looks right for the job.'],
    ],
  },
};


function formatServiceLocationIntro(serviceName) {
  const serviceLower = serviceName.toLowerCase();

  const intros = {
    'Regular House Cleaning':
      'If you are looking for regular house cleaning in Worthing, Littlehampton, Crawley, Horsham, Chichester or nearby West Sussex towns, our local pages make it easier to find cleaners with live availability and compare profiles before booking.',
    'Deep Cleaning':
      'If you need deep cleaning in Worthing, Littlehampton, Crawley, Horsham, Chichester or nearby West Sussex towns, you can use our location pages to find local cleaners, compare profiles, and check availability before you book.',
    'End of Tenancy':
      'If you are moving out in Worthing, Littlehampton, Crawley, Horsham, Chichester or nearby West Sussex towns, our location pages help you find end of tenancy cleaners faster and compare available providers in your area.',
    'Oven Cleaning':
      'If you need oven cleaning in Worthing, Littlehampton, Crawley, Horsham, Chichester or nearby West Sussex towns, our local pages help you discover cleaners offering the service and book based on live availability.',
  };

  return (
    intros[serviceName] ||
    `If you are looking for ${serviceLower} in Worthing, Littlehampton, Crawley, Horsham, Chichester or nearby West Sussex towns, our location pages help you find local cleaners, compare profiles, and check live availability before booking.`
  );
}

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normaliseServiceFromSlug(slug = '') {
  return SERVICE_ALIASES[slug] || ALL_SERVICE_OPTIONS.find((service) => slugify(service) === slug) || null;
}

function getCategory(serviceName) {
  return Object.entries(SERVICE_CATEGORIES).find(([, services]) => services.includes(serviceName))?.[0] || 'Cleaning Services';
}

function getServiceCopy(serviceName) {
  const base = SERVICE_COPY[serviceName];
  if (base) return base;

  const lower = serviceName.toLowerCase();
  return {
    intro: `Looking for ${lower} near me? FindTrustedCleaners.com helps you compare professional ${lower} services across the UK, see live cleaner availability, and book instantly without waiting for quotes.`,
    included: [
      `A clearer route to booking ${lower} services near you with real-time availability shown on cleaner profiles.`,
      `Transparent cleaner profiles so you can compare options before you commit.`,
      `A more practical way to find affordable ${lower} without filling out multiple quote forms.`,
      `Support for customers who want trusted ${lower} providers with a simpler booking process.`,
    ],
    cleanerProvides: [
      `${serviceName} appointments scheduled around the cleaner's listed availability.`,
      `Service scope that varies by cleaner, property type, and whether extra tasks are included.`,
      `A more direct booking journey for local ${lower} services in the areas they cover.`,
    ],
    faqs: [
      [`How much does ${lower} cost in the UK?`, `Pricing varies based on the size of the job, your location, and what the cleaner includes. Cleaner profiles make it easier to compare options before booking.`],
      [`Can I book same-day ${lower}?`, `Sometimes. Same-day ${lower} depends on cleaner availability in your area and the time needed for the job.`],
      [`What does ${lower} include?`, `That depends on the cleaner and the service scope shown on their profile. It is worth checking individual listings to compare what is included.`],
      [`How long does ${lower} take?`, `The time required depends on the property, job size, and the condition of the area being cleaned.`],
      [`Can I choose a local cleaner before booking?`, `Yes. You can compare cleaner profiles, see availability, and book the option that suits you best.`],
    ],
  };
}

function getRelatedServices(serviceName) {
  const category = getCategory(serviceName);
  const sameCategory = SERVICE_CATEGORIES[category] || [];
  const fallback = ALL_SERVICE_OPTIONS;

  return [...sameCategory, ...fallback]
    .filter((name) => name !== serviceName)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 4)
    .map((name) => ({ name, href: `/services/${slugify(name)}` }));
}

function buildFaqSchema(serviceName, faqs, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

function buildServiceSchema(serviceName, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    serviceType: serviceName,
    areaServed: 'United Kingdom',
    provider: {
      '@type': 'Organization',
      name: 'FindTrustedCleaners.com',
      url: SITE_URL,
    },
    url,
    description: `Find and book ${serviceName.toLowerCase()} services through FindTrustedCleaners.com with live cleaner availability, profile visibility, and instant booking support.`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function generateStaticParams() {
  return [
    ...ALL_SERVICE_OPTIONS.map((name) => ({ slug: slugify(name) })),
    { slug: 'regular-cleaning' },
    { slug: 'end-of-tenancy-cleaning' },
  ];
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const serviceName = normaliseServiceFromSlug(decodeURIComponent(resolvedParams?.slug || ''));

  if (!serviceName) {
    return {
      title: 'Cleaning Services | Find Trusted Cleaners',
      description: 'Browse cleaning services, compare cleaner profiles, and book trusted local help with live availability.',
    };
  }

  const serviceLower = serviceName.toLowerCase();
  const canonical = serviceName === 'End of Tenancy'
    ? '/services/end-of-tenancy-cleaning'
    : serviceName === 'Regular House Cleaning'
      ? '/services/regular-cleaning'
      : `/services/${slugify(serviceName)}`;
  const title = `${serviceName} Near You | Book Online`;
  const description = `Find ${serviceLower} near you. View live cleaner availability, compare profiles, and book instantly with FindTrustedCleaners.com.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function ServicePage({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams?.slug || '');
  const serviceName = normaliseServiceFromSlug(slug);

  if (!serviceName) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#f8fafc_100%)] text-slate-900">
        <PublicHeader />
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Service not found</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Cleaning service page unavailable</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">The service page you tried to open is not available yet, but you can still browse cleaners and compare live availability across the platform.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services" className="inline-flex rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.25)]">Browse services</Link>
              <Link href="/cleaners" className="inline-flex rounded-xl border border-teal-200 bg-white px-5 py-3 font-semibold text-teal-700">View available cleaners</Link>
            </div>
          </div>
        </section>
        <PublicFooter />
      </main>
    );
  }

  const serviceLower = serviceName.toLowerCase();
  const copy = getServiceCopy(serviceName);
  const category = getCategory(serviceName);
  const relatedServices = getRelatedServices(serviceName);
  const blogLinks = BLOG_LINKS[serviceName] || BLOG_LINKS.default;
  const canonicalPath = serviceName === 'End of Tenancy'
    ? '/services/end-of-tenancy-cleaning'
    : serviceName === 'Regular House Cleaning'
      ? '/services/regular-cleaning'
      : `/services/${slugify(serviceName)}`;
  const absoluteUrl = `${SITE_URL.replace(/\/$/, '')}${canonicalPath}`;
  const faqSchema = buildFaqSchema(serviceName, copy.faqs, absoluteUrl);
  const serviceSchema = buildServiceSchema(serviceName, absoluteUrl);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_32%),linear-gradient(135deg,#f8fffe_0%,#eefcf9_48%,#ffffff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-[32px] border border-white/70 bg-white/84 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">{category}</p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{serviceName} Near You</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{copy.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/cleaners?service=${encodeURIComponent(serviceName)}`} className="inline-flex rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.25)]">View available cleaners</Link>
              <Link href={`/cleaners?service=${encodeURIComponent(serviceName)}`} className="inline-flex rounded-xl border border-teal-200 bg-white px-5 py-3 font-semibold text-teal-700">Book instantly</Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                'See real-time cleaner availability',
                'Book instantly without waiting for quotes',
                'View cleaner profiles before booking',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm font-medium text-teal-900">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-teal-900">Why choose our platform for {serviceLower}?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Real-time availability',
                text: `See which cleaners actually have space for ${serviceLower} before you commit, which is especially useful when you need a fast booking.`
              },
              {
                title: 'No waiting for quotes',
                text: `Instead of filling out forms and waiting around, you can compare ${serviceLower} providers directly and move ahead when the timing works.`
              },
              {
                title: 'Transparent cleaner profiles',
                text: 'Cleaner profiles help you compare services, trust signals, and availability before booking, giving you more confidence in the decision.'
              },
              {
                title: 'Trusted local cleaners',
                text: `FindTrustedCleaners.com is built to help you discover local ${serviceLower} services with a clearer, more direct booking path.`
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-slate-50 p-5">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-slate-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="mb-5 text-2xl font-bold tracking-tight text-teal-900">What\'s included in this service</h2>
            <ul className="space-y-3 text-slate-700">
              {copy.included.map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" /> <span>{item}</span></li>
              ))}
            </ul>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="mb-5 text-2xl font-bold tracking-tight text-teal-900">What cleaners typically provide</h2>
            <ul className="space-y-3 text-slate-700">
              {copy.cleanerProvides.map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" /> <span>{item}</span></li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mb-10 rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-teal-900">How it works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: '1. Search your area', text: `Start by searching for ${serviceLower} in your area and narrow down the cleaners that fit the job.` },
              { title: '2. View available cleaners', text: 'Compare profiles, check live availability, and look at the service details before choosing who to book.' },
              { title: '3. Book instantly', text: 'Move ahead with the cleaner you prefer without waiting for a traditional quote cycle.' },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl bg-slate-50 p-5">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="text-slate-700">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-[32px] border border-teal-100 bg-teal-50/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Internal link hub</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Use this page to jump into our lead local areas</h2>
              <p className="mt-3 text-slate-700">Looking for {serviceLower} in Worthing, Littlehampton, Crawley, Horsham, Chichester or nearby West Sussex towns? Use the location pages below to see local cleaner coverage and move into live profiles faster.</p>
            </div>
            <Link href="/services" className="inline-flex rounded-xl border border-teal-200 bg-white px-5 py-3 font-semibold text-teal-700">Browse all services</Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {CORE_LOCATION_LINKS.map((location) => (
              <Link
                key={location.href}
                href={location.href}
                className="rounded-full border border-teal-200 bg-white px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-teal-50"
              >
                {serviceName} in {location.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-teal-900">Service coverage and local support</h2>
            <p className="text-slate-700">This service is available across multiple areas including Worthing, Littlehampton, Bognor Regis, Chichester, Crawley, Horsham, Lancing, Shoreham-by-Sea, Rustington, Angmering, Haywards Heath, East Grinstead and Burgess Hill. That helps this page support local intent as well as broader UK searches for {serviceLower}.</p>
            <p className="mt-4 text-slate-700">{formatServiceLocationIntro(serviceName)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {CORE_LOCATION_LINKS.map((location) => (
                <Link
                  key={location.href}
                  href={location.href}
                  className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 font-medium text-teal-800 transition hover:border-teal-300 hover:bg-white"
                >
                  {serviceName} in {location.label}
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-teal-900">Related services</h2>
            <div className="space-y-3">
              {relatedServices.map((service) => (
                <Link key={service.href} href={service.href} className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800 transition hover:border-teal-200 hover:text-teal-800">{service.name}</Link>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Helpful reading</h3>
              <div className="space-y-3">
                {blogLinks.map((post) => (
                  <Link key={post.href} href={post.href} className="block text-teal-700 underline underline-offset-4">{post.label}</Link>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="mb-10 rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-teal-900">Frequently asked questions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {copy.faqs.map(([question, answer]) => (
              <div key={question} className="rounded-2xl bg-slate-50 p-5">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{question}</h3>
                <p className="text-slate-700">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-teal-100 bg-[linear-gradient(135deg,rgba(20,184,166,0.10),rgba(255,255,255,0.96))] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ready to book {serviceLower}?</h2>
          <p className="mt-3 max-w-2xl text-slate-700">See available cleaners, compare profiles, and move quickly while suitable slots are still open. Same-day availability may be possible depending on your area and the cleaner\'s calendar.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/cleaners?service=${encodeURIComponent(serviceName)}`} className="inline-flex rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.25)]">View available cleaners</Link>
            <Link href={`/cleaners?service=${encodeURIComponent(serviceName)}`} className="inline-flex rounded-xl border border-teal-200 bg-white px-5 py-3 font-semibold text-teal-700">Book instantly</Link>
          </div>
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}
