export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.findtrustedcleaners.com';

export const COUNTY_HUBS = [
  { slug: 'west-sussex', name: 'West Sussex', status: 'active', href: '/locations/west-sussex', summary: 'The core county hub linking Worthing, Lancing, Shoreham-by-Sea, Littlehampton, Chichester, Bognor Regis, Horsham, Crawley and surrounding towns.' },
  { slug: 'east-sussex', name: 'East Sussex', status: 'planned', href: '/locations/east-sussex', summary: 'Planned expansion area. Keep this as a future-facing signal without indexing thin pages until content and cleaners are ready.' },
];

export const WEST_SUSSEX_AREAS = [
  ['West Sussex', '/locations/west-sussex'], ['Worthing', '/locations/worthing'], ['Lancing', '/locations/lancing'], ['Shoreham-by-Sea', '/locations/shoreham-by-sea'], ['Littlehampton', '/locations/littlehampton'], ['Angmering', '/locations/angmering'], ['Rustington', '/locations/rustington'], ['Bognor Regis', '/locations/bognor-regis'], ['Chichester', '/locations/chichester'], ['Horsham', '/locations/horsham'], ['Crawley', '/locations/crawley'], ['Burgess Hill', '/locations/burgess-hill'], ['Haywards Heath', '/locations/haywards-heath'],
];

export const CORE_SERVICE_LINKS = [
  ['Domestic cleaning', '/services/domestic-cleaning'], ['Regular cleaning', '/services/regular-cleaning'], ['Deep cleaning', '/services/deep-cleaning'], ['End of tenancy cleaning', '/services/end-of-tenancy-cleaning'], ['Oven cleaning', '/services/oven-cleaning'], ['Carpet cleaning', '/services/carpet-cleaning'], ['Window cleaning', '/services/window-cleaning'], ['Gutter cleaning', '/services/gutter-cleaning'], ['Pressure washing', '/services/pressure-washing'],
];

export const SUPPORTING_GUIDES = [
  ['How to hire a cleaner', '/blog/how-to-hire-a-cleaner'], ['End of tenancy cleaning checklist', '/blog/end-of-tenancy-cleaning-checklist'], ['Cleaner prices in Littlehampton', '/blog/cleaners-littlehampton-prices'], ['Reliable cleaners in Littlehampton', '/blog/reliable-cleaner-littlehampton'], ['Cleaner prices in Crawley', '/blog/cleaner-prices-crawley'], ['Cleaners in Horsham guide', '/blog/cleaners-in-horsham-guide'], ['Find a reliable cleaner in Worthing', '/blog/how-to-find-a-reliable-cleaner-in-worthing'],
];

export const TRUST_SIGNALS = [
  'Free profile browsing for clients', 'Cleaner profiles with services, pricing and availability', 'Optional cleaner verification and insurance signals', 'Booking requests handled through the platform', 'Built for UK households, landlords and local cleaning businesses',
];

export function buildBreadcrumbSchema(items = []) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${SITE_URL}${item.href}` })) };
}

export function buildWebSiteSchema() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: 'FindTrustedCleaners.com', url: SITE_URL, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/cleaners?postcode={search_term_string}`, 'query-input': 'required name=search_term_string' } };
}

export function buildOrganisationSchema() {
  return { '@context': 'https://schema.org', '@type': 'Organization', name: 'FindTrustedCleaners.com', url: SITE_URL, logo: `${SITE_URL}/findtrusted-logo.png`, sameAs: [] };
}
