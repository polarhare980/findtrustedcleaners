export const runtime = "nodejs";

export async function GET() {
  const BASE =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.findtrustedcleaners.com";

  const urls = [
    `${BASE}/`,
    `${BASE}/cleaners`,
    `${BASE}/blog`,
    `${BASE}/about`,
    `${BASE}/contact`,
    `${BASE}/privacy`,
    `${BASE}/terms`,
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
