'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const PAGE_SIZE = 10;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const estimateReadTime = (wordCount) => Math.max(1, Math.round((wordCount || 600) / 200));

export default function BlogListClient({ initialTag = '' }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new'); // 'new' | 'old' | 'title'
  const [activeTag, setActiveTag] = useState(initialTag);

  const sentinelRef = useRef(null);

  const fetchPage = useCallback(async (pageNum) => {
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_SIZE));
    params.set('page', String(pageNum));
    if (activeTag) params.set('tag', activeTag);
    const url = `/api/blogs?${params.toString()}`;

    const res = await fetch(url, { credentials: 'include' });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    if (!isJson) throw new Error('Unexpected response');
    const data = await res.json();

    const list = Array.isArray(data) ? data : (data.blogs || []);
    const total = Array.isArray(data) ? undefined : data.total;

    return { list, total };
  }, [activeTag]);

  // Initial + when tag changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setPage(1);
        const { list, total } = await fetchPage(1);
        if (!mounted) return;
        setBlogs(list);
        setHasMore(total ? list.length < total : list.length === PAGE_SIZE);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to load blog posts. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchPage]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        (async () => {
          try {
            setLoadingMore(true);
            const next = page + 1;
            const { list, total } = await fetchPage(next);
            setBlogs((prev) => [...prev, ...list]);
            setPage(next);
            const reachedEnd = list.length < PAGE_SIZE || (total ? next * PAGE_SIZE >= total : false);
            setHasMore(!reachedEnd);
          } catch (err) {
            console.error('Load more failed:', err);
            setHasMore(false);
          } finally {
            setLoadingMore(false);
          }
        })();
      }
    }, { rootMargin: '600px 0px 0px 0px' });

    io.observe(el);
    return () => io.disconnect();
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  // Build tag list from what we have loaded (works even if API lacks /tags)
  const discoveredTags = useMemo(() => {
    const s = new Set();
    blogs.forEach(b => (b.tags || []).forEach(t => s.add(String(t))));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [blogs]);

  // Client-side filter/sort for UX
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = blogs;
    if (q) {
      out = blogs.filter((b) =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.excerpt || '').toLowerCase().includes(q) ||
        (b.content || '').toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'old':
        out = [...out].sort((a, b) => new Date(a.publishedAt || a.createdAt || 0) - new Date(b.publishedAt || b.createdAt || 0));
        break;
      case 'title':
        out = [...out].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        out = [...out].sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
    }
    return out;
  }, [blogs, query, sort]);

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-[300px]">
      <div className="w-12 h-12 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
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

  const AdSlot = ({ slot }) => {
    useEffect(() => {
      // try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
    }, []);
    return (
      <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[16px] p-4 text-center">
        {/* 
          <ins className="adsbygoogle"
               style={{display:'block'}}
               data-ad-client="ca-pub-1234567890123456"
               data-ad-slot={slot}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins> 
        */}
        <div className="text-xs text-gray-500">Ad</div>
      </div>
    );
  };

  const itemListJsonLd = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.findtrustedcleaners.com';
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: filtered.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${base}/blog/${(b.slug || '').replace(/^\/?blog\//, '')}`,
        name: b.title,
      })),
    };
  }, [filtered]);

  return (
    <main className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-teal-800/15 to-teal-700/10" />
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-3">
              {activeTag ? `Posts tagged “${activeTag}”` : 'Our Blog 📖'}
            </h1>
            <p className="text-lg text-gray-700">
              {activeTag
                ? 'Browse all articles under this tag.'
                : 'Expert cleaning tips, industry insights, and helpful guides to keep your space spotless.'}
            </p>
          </motion.div>

          {/* Controls */}
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[16px] p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                type="search"
                placeholder="Search articles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded-xl border border-white/30 bg-white/60 px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Sort:</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-sm"
                >
                  <option value="new">Newest</option>
                  <option value="old">Oldest</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tag chips (from loaded posts) */}
          {discoveredTags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <Link
                href="/blog"
                className={`text-sm px-3 py-1 rounded-full border ${!activeTag ? 'bg-teal-600 text-white border-teal-600' : 'bg-white/70 border-white/40 text-gray-800 hover:bg-white'}`}
              >
                All
              </Link>
              {discoveredTags.map((t) => (
                <Link
                  key={t}
                  href={`/blog/tag/${encodeURIComponent(t)}`}
                  className={`text-sm px-3 py-1 rounded-full border ${activeTag === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white/70 border-white/40 text-gray-800 hover:bg-white'}`}
                >
                  {t}
                </Link>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          {filtered.length === 0 ? (
            loading ? <LoadingSpinner /> : <EmptyState />
          ) : (
            <div className="grid gap-8 md:gap-10">
              {filtered.map((blog, index) => (
                <motion.article
                  key={blog._id || blog.slug || index}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
                  className="group"
                >
                  <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-teal-800 mb-2 group-hover:text-teal-700 transition-colors">
                          {blog.title}
                        </h2>
                        {blog.excerpt && (
                          <p className="text-gray-700 mb-3 line-clamp-3">{blog.excerpt}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {(blog.publishedAt || blog.createdAt) && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 01-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(blog.publishedAt || blog.createdAt)}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {(blog.readTime || estimateReadTime(blog.wordCount))} min read
                          </span>

                          {/* Tag pills on card */}
                          {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                            <span className="flex flex-wrap gap-1">
                              {blog.tags.slice(0, 3).map((t) => (
                                <Link
                                  key={t}
                                  href={`/blog/tag/${encodeURIComponent(t)}`}
                                  className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-full hover:bg-teal-100"
                                >
                                  {t}
                                </Link>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Link
                          href={`/blog/${(blog.slug || '').replace(/^\/?blog\//, '')}`}
                          className="inline-flex items-center bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 font-medium group"
                        >
                          Read More
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Optional in-feed ads */}
                  {index === 1 && <AdSlot slot="XXXXXXXXXX" />}
                  {index === 5 && <AdSlot slot="YYYYYYYYYY" />}
                </motion.article>
              ))}

              {hasMore && (
                <div ref={sentinelRef} className="h-12 flex items-center justify-center">
                  {loadingMore ? <LoadingSpinner /> : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </main>
  );
}
