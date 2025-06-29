import blogPosts from '@/data/blogPosts';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default function AuthorPage({ params }) {
  const { authorSlug } = params;

  // Find posts by this author
  const authorPosts = blogPosts.filter((post) => post.author.slug === authorSlug);

  if (authorPosts.length === 0) {
    notFound();
  }

  const author = authorPosts[0].author;

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-32 h-32 object-cover rounded-full mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-teal-700 mb-2">{author.name}</h1>
        <p className="text-gray-600">{author.bio}</p>
      </div>

      <div className="space-y-6">
        {authorPosts.map((post) => (
          <div key={post.slug} className="border-b pb-4">
            <h2 className="text-2xl font-semibold mb-2">
              <Link href={`/blog/${post.slug}`} className="text-teal-600 hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600">{post.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/blog" className="text-teal-600 underline">
          ← Back to Blog
        </Link>
      </div>
    </main>
  );
}
