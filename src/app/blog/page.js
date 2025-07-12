'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        const data = await res.json();
        setBlogs(data);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin"></div>
    </div>
  );

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-teal-800 mb-2">No Blog Posts Yet</h3>
      <p className="text-gray-600 mb-6">We&apos;re working on creating amazing content for you. Check back soon!</p>
      <Link
        href="/"
        className="inline-block bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ease-in-out font-medium"
      >
        Return Home
      </Link>
    </motion.div>
  );

  if (loading) {
    return (
      <main className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-teal-800/15 to-teal-700/10"></div>
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8">
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-teal-800/15 to-teal-700/10"></div>
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-4">
              Our Blog 📖
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Discover expert cleaning tips, industry insights, and helpful guides to keep your space spotless.
            </p>
          </motion.div>

          {blogs.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid gap-8 md:gap-10"
            >
              {blogs.map((blog, index) => (
                <motion.article
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 ease-in-out">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-teal-800 mb-3 group-hover:text-teal-700 transition-colors duration-300">
                          {blog.title}
                        </h2>

                        {blog.excerpt && (
                          <p className="text-gray-700 mb-4 line-clamp-3">{blog.excerpt}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          {blog.publishedAt && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(blog.publishedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          )}

                          {blog.readTime && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {blog.readTime} min read
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Link
                          href={`/blog/${blog.slug.replace(/^\/?blog\//, '')}`}
                          className="inline-flex items-center bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 ease-in-out font-medium group"
                        >
                          Read More
                          <svg
                            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
