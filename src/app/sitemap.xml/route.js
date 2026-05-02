export const runtime = "nodejs";

export async function GET() {
  const BASE =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.findtrustedcleaners.com";

  const serviceUrls = [
    'regular-house-cleaning',
    'regular-cleaning',
    'deep-cleaning',
    'spring-cleaning',
    'end-of-tenancy',
    'end-of-tenancy-cleaning',
    'after-party-cleaning',
    'holiday-let-cleaning',
    'oven-cleaning',
    'carpet-cleaning',
    'upholstery-cleaning',
    'mattress-cleaning',
    'curtain-cleaning',
    'mould-removal',
    'window-cleaning',
    'gutter-cleaning',
    'roof-cleaning',
    'pressure-washing',
    'car-valeting',
    'fleet-cleaning',
    'office-cleaning',
    'retail-cleaning',
    'gym-cleaning',
  ].map((slug) => `${BASE}/services/${slug}`);

  const blogUrls = [
    'oven-cleaning-shoreham-by-sea',
    'mattress-cleaning-shoreham',
  ].map((slug) => `${BASE}/blog/${slug}`);

  const urls = [
    `${BASE}/`,
    `${BASE}/cleaners`,
    `${BASE}/blog`,
    `${BASE}/about`,
    `${BASE}/contact`,
    `${BASE}/privacy`,
    `${BASE}/terms`,
    `${BASE}/services`,
    `${BASE}/locations/west-sussex`,
    `${BASE}/locations/worthing`,
    `${BASE}/locations/lancing`,
    `${BASE}/locations/shoreham-by-sea`,
    `${BASE}/locations/littlehampton`,
    `${BASE}/locations/angmering`,
    `${BASE}/locations/rustington`,
    `${BASE}/locations/bognor-regis`,
    `${BASE}/locations/chichester`,
    ...serviceUrls,
    ...blogUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (u) => `<url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    )
    .join("")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
