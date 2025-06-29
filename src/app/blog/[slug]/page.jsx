import blogPosts from '@/data/blogPosts';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';

export default function BlogPostPage({ params }) {
  const { slug } = params;

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <SEO
        title={post.title}
        description={post.description}
        url={`https://www.findtrustedcleaners.com/blog/${post.slug}`}
      />
      <main className="min-h-screen p-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h1 className="text-4xl font-bold text-teal-700">{post.title}</h1>
          <div className="text-gray-500 text-sm">
            By{' '}
            <Link href={`/authors/${post.author.slug}`} className="text-teal-600 underline">
              {post.author.name}
            </Link>{' '}
            • {new Date(post.date).toLocaleDateString()}
          </div>
          <img src={post.image} alt={post.title} className="w-full h-80 object-cover rounded-2xl" />
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: marked(post.content) }}></div>
          <Link href="/blog" className="text-teal-600 underline">
            ← Back to Blog
          </Link>
        </motion.div>
      </main>
    </>
  );
}

// Install 'marked' to convert markdown to HTML
// npm install marked
import { marked } from 'marked';
