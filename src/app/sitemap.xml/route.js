export const runtime = "nodejs";

import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import Cleaner from '@/models/Cleaner';

const BASE = 'https://www.findtrustedcleaners.com';

const SERVICES = [
  'regular-cleaning','deep-cleaning','spring-cleaning','end-of-tenancy-cleaning','after-party-cleaning','holiday-let-cleaning','oven-cleaning','carpet-cleaning','upholstery-cleaning','mattress-cleaning','curtain-cleaning','mould-removal','window-cleaning','gutter-cleaning','roof-cleaning','pressure-washing','car-valeting','fleet-cleaning','office-cleaning','retail-cleaning','gym-cleaning',
];

const LOCATIONS = [
  'west-sussex','worthing','goring-by-sea','durrington','tarring','broadwater','findon','lancing','shoreham-by-sea','southwick','sompting','littlehampton','rustington','angmering','east-preston','ferring','arundel','bognor-regis','felpham','aldwick','barnham','yapton','chichester','selsey','bosham','emsworth','southbourne','east-wittering','west-wittering','midhurst','petworth','crawley','gatwick','ifield','three-bridges','pound-hill','maidenbower','tilgate','bewbush','horsham','southwater','billingshurst','pulborough','storrington','steyning','henfield','ashington','burgess-hill','haywards-heath','east-grinstead','hassocks','hurstpierpoint','cuckfield','lindfield','bolney','handcross',
];

const STATIC_BLOGS = [
  'end-of-tenancy-cleaning-checklist','how-to-hire-a-cleaner','oven-cleaning-shoreham-by-sea','mattress-cleaning-shoreham','home-cleaning-services-worthing','cleaning-services-worthing','carpet-cleaning-in-worthing-trusted-local-companies-west-sussex','how-to-find-a-reliable-cleaner-in-worthing','cleaners-littlehampton-prices','reliable-cleaner-littlehampton','what-do-cleaners-do-littlehampton','cleaners-in-horsham-guide','find-trusted-cleaners-platform','cleaner-prices-crawley',
];

function cleanSlug(value = '') {
  return String(value || '').trim().replace(/^\/+/, '').replace(/^blog\/+?/i, '').replace(/\/+$/, '').toLowerCase();
}

function xmlEscape(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET() {
  const urls = new Set([
    `${BASE}/`, `${BASE}/cleaners`, `${BASE}/blog`, `${BASE}/about`, `${BASE}/contact`, `${BASE}/privacy-policy`, `${BASE}/terms`, `${BASE}/services`, `${BASE}/faq`, `${BASE}/how-it-works`, `${BASE}/cookie-policy`,
    ...SERVICES.map((slug) => `${BASE}/services/${slug}`),
    ...LOCATIONS.map((slug) => `${BASE}/locations/${slug}`),
    ...STATIC_BLOGS.map((slug) => `${BASE}/blog/${slug}`),
  ]);

  try {
    await connectToDatabase();

    const posts = await BlogPost.find({ published: { $ne: false } }).select('slug tags updatedAt').lean();
    for (const post of posts) {
      const slug = cleanSlug(post.slug);
      if (slug) urls.add(`${BASE}/blog/${slug}`);
      for (const tag of post.tags || []) {
        const safeTag = String(tag || '').trim();
        if (safeTag) urls.add(`${BASE}/blog/tag/${encodeURIComponent(safeTag)}`);
      }
    }

    const cleaners = await Cleaner.find({}).select('_id').lean();
    for (const cleaner of cleaners) {
      if (cleaner?._id) urls.add(`${BASE}/cleaners/${cleaner._id}`);
    }
  } catch {
    // Keep the sitemap valid during local builds or if the database is unavailable.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls)
  .filter((u) => !u.includes('.co.uk') && !u.endsWith('/privacy'))
  .map((u) => `  <url><loc>${xmlEscape(u)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
