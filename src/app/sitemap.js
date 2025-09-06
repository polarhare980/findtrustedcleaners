export default async function sitemap() {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.findtrustedcleaners.com';

  const staticPages = ['', '/cleaners', '/blog', '/about', '/contact', '/faq', '/privacy-policy', '/cookie-policy', '/terms'].map(p => ({ url: `${BASE}${p}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 }));

  return [...staticPages];
}
