import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';

export const metadata = {
  title: 'Cleaning Tips & Guides | FindTrustedCleaners Blog',
  description: 'Expert cleaning tips, oven care guides, DIY advice, and industry insights from FindTrustedCleaners.',
  alternates: {
    canonical: 'https://www.findtrustedcleaners.com/blog',
  },
  openGraph: {
    title: 'FindTrustedCleaners Blog',
    description: 'Expert cleaning tips, oven care guides, and DIY advice.',
    url: 'https://www.findtrustedcleaners.com/blog',
    siteName: 'FindTrustedCleaners',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// NOTE:
// This page is a Server Component, so we can read from MongoDB directly.
// Doing so avoids brittle server-side `fetch('/api/...')` issues when
// NEXT_PUBLIC_SITE_URL isn't set (which can result in an empty list).
async function fetchPosts() {
  try {
    await connectToDatabase();
    const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
    return posts || [];
  } catch (e) {
    console.error('❌ BlogIndex failed to load posts:', e?.message || e);
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await fetchPosts();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Cleaning Tips & Guides</h1>

      <div className="mb-6">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || ''}
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
        <script
          dangerouslySetInnerHTML={{
            __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
          }}
        />
      </div>

      <ul className="space-y-3">
        {posts.length === 0 ? (
          <li className="text-sm text-slate-600">
            No posts yet. If you&apos;re expecting articles here, make sure your MongoDB connection is set up and you&apos;ve created blog posts.
          </li>
        ) : (
          posts.map((p) => (
            <li key={p._id?.toString?.() || p.slug}>
              <Link href={`/blog/${p.slug}`} className="text-teal-700 hover:underline font-medium">
                {p.title}
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
