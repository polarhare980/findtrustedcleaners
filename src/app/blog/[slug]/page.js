import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import BlogPostClient from './BlogPostClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Ensures fresh data on every request

export default async function BlogPostPage({ params }) {
  const { slug } = params;

  await connectToDatabase();
  const post = await BlogPost.findOne({ slug });

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 flex items-center justify-center p-6">
        <div className="max-w-xl text-center bg-white/30 backdrop-blur-md p-10 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold mb-4 text-teal-800">Post Not Found</h1>
          <p className="text-gray-700 mb-6">
            Sorry, that blog post doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/blog"
            className="text-white bg-teal-600 hover:bg-teal-700 transition px-6 py-3 rounded-full font-medium"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <BlogPostClient
      post={JSON.parse(JSON.stringify(post))}
      readingTime={readingTime}
      wordCount={wordCount}
    />
  );
}
