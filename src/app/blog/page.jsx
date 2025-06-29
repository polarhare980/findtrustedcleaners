'use client';

import Link from 'next/link';
import blogPosts from '@/data/blogPosts';


export default function BlogPage() {
  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-teal-700">Our Blog</h1>
      <div className="grid gap-8">
        {blogPosts.map((post) => (
          <motion.div
            key={post.slug}
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-lg rounded-2xl overflow-hidden"
          >
            <Link href={`/blog/${post.slug}`}>
              <img src={post.image} alt={post.title} className="w-full h-60 object-cover" />
              <div className="p-4">
                <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-4">{post.description}</p>
                <div className="text-sm text-gray-500">By {post.author.name} • {new Date(post.date).toLocaleDateString()}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
