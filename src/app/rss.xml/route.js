export const runtime = 'nodejs';
function rss({ items = [] } = {}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>FindTrustedCleaners Blog</title>
  <link>${base}/blog</link>
  <description>Tips and checklists to make cleaning hassle-free.</description>
  ${items.map(it => `
  <item>
    <title><![CDATA[${it.title}]]></title>
    <link>${base}${it.link}</link>
    <guid>${base}${it.link}</guid>
    <description><![CDATA[${it.description}]]></description>
    <pubDate>${new Date(it.date || Date.now()).toUTCString()}</pubDate>
  </item>`).join('')}
</channel>
</rss>`; return feed;
}
export async function GET() {
  const items = [
    { title: 'How to Hire a Cleaner in the UK', link: '/blog/how-to-hire-a-cleaner', description: 'A practical, step-by-step guide to hiring a reliable cleaner in the UK.' },
    { title: 'End of Tenancy Cleaning Checklist', link: '/blog/end-of-tenancy-cleaning-checklist', description: 'A room-by-room checklist to get your deposit back.' }
  ];
  const xml = rss({ items });
  return new Response(xml, { status: 200, headers: { 'content-type': 'application/rss+xml; charset=UTF-8' } });
}
