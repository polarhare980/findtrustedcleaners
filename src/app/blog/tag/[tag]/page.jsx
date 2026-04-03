// app/blog/tag/[tag]/page.jsx
import BlogListClient from '../../BlogListClient';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const tag = decodeURIComponent(resolvedParams?.tag || '').trim();
  const safe = tag.replace(/\s+/g, ' ').slice(0, 60);
  const title = `${safe} Articles | FindTrustedCleaners Blog`;
  const desc = `Posts tagged “${safe}” — cleaning tips, guides, and insights from FindTrustedCleaners.`;

  const url = `https://www.findtrustedcleaners.com/blog/tag/${encodeURIComponent(safe)}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: 'FindTrustedCleaners',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default async function TagPage({ params }) {
  const resolvedParams = await params;
  const tag = decodeURIComponent(resolvedParams?.tag || '').trim();
  return <BlogListClient initialTag={tag} />;
}
