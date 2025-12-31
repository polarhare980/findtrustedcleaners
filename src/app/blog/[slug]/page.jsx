import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';

export async function generateMetadata({ params }) {
  const { slug } = params;

  await connectToDatabase();
  const post = await BlogPost.findOne({ slug }).lean();

  if (!post) {
    return {
      title: 'Article not found | FindTrustedCleaners',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${post.title} | FindTrustedCleaners`,
    description: post.excerpt || post.title,
    alternates: {
      canonical: `https://www.findtrustedcleaners.com/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: `https://www.findtrustedcleaners.com/blog/${slug}`,
      siteName: 'FindTrustedCleaners',
      type: 'article',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Server Component — read from MongoDB directly
async function fetchPost(slug) {
  try {
    await connectToDatabase();
    const post = await BlogPost.findOne({ slug }).lean();
    return post || null;
  } catch (e) {
    console.error('❌ BlogPost failed to load:', e?.message || e);
    return null;
  }
}

export default async function BlogPostPage({ params }) {
  const post = await fetchPost(params.slug);

  if (!post) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <article>
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full rounded-lg mb-6"
          />
        )}

        <div
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-8 text-sm text-slate-500">
          Published{' '}
          {post.createdAt
            ? new Date(post.createdAt).toLocaleDateString('en-GB')
            : ''}
        </div>
      </article>
    </main>
  );
}
