import Link from 'next/link';

export const metadata = {
  title: 'Cleaning Tips & Guides',
  description: 'Short, useful cleaning guides designed to rank and monetise with AdSense.',
};

async function fetchPosts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/blogs`, { cache: 'no-store' });
    const json = await res.json();
    return json?.posts || [];
  } catch (e) {
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await fetchPosts();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Cleaning Tips & Guides</h1>

      <div className="mb-6">
        <ins className="adsbygoogle"
             style={{ display: "block" }}
             data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || ''}
             data-ad-slot="auto"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script dangerouslySetInnerHTML={{ __html: "(adsbygoogle = window.adsbygoogle || []).push({});" }}/>
      </div>

      <ul className="space-y-3">
        {posts.map(p => (
          <li key={p._id || p.slug}>
            <Link href={`/blog/${p.slug}`} className="text-teal-700 hover:underline font-medium">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
