'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const PAGE_SIZE = 10;
const FALLBACK_IMAGES = ['/og-image.jpg', '/background.jpg', '/cleaner-illustration.png'];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Editorial guide';
const estimateReadTime = (wordCount) => Math.max(1, Math.round((wordCount || 600) / 200));

function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeBullets(blog) {
  if (Array.isArray(blog.takeaways) && blog.takeaways.length) {
    return blog.takeaways.map((item) => cleanText(item)).filter(Boolean).slice(0, 3);
  }

  const source = cleanText(blog.excerpt || blog.description || blog.content || '');
  if (!source) return ['A calm, useful guide for planning your next clean.', 'Short, practical and easy to scan.'];

  const sentences = source
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/[.!?]+$/, '').trim())
    .filter(Boolean);

  if (sentences.length >= 2) return sentences.slice(0, 3);

  const words = source.split(' ').filter(Boolean);
  return [
    words.slice(0, 12).join(' '),
    words.slice(12, 26).join(' ') || 'A quick editorial read for cleaner home decisions',
  ].filter(Boolean);
}

function normaliseSlug(slug = '') {
  return String(slug).replace(/^\/?blog\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function getImage(blog, index = 0) {
  return blog.coverImage || blog.image || blog.heroImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function MagazineCard({ blog, index, featured = false }) {
  const href = `/blog/${normaliseSlug(blog.slug || '')}`;
  const bullets = makeBullets(blog);
  const tags = Array.isArray(blog.tags) ? blog.tags.slice(0, 2) : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
      className="h-full"
    >
      <Link
        href={href}
        className={`group relative flex h-full min-h-[460px] flex-col justify-end overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.18)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_38px_110px_rgba(15,23,42,0.28)] ${featured ? 'lg:min-h-[620px]' : ''}`}
      >
        <Image
          src={getImage(blog, index)}
          alt={blog.title || 'FindTrustedCleaners magazine article'}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
          sizes={featured ? '(max-width: 1024px) 100vw, 64vw' : '(max-width: 768px) 88vw, 34vw'}
          priority={featured}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04)_0%,rgba(2,6,23,0.2)_38%,rgba(2,6,23,0.88)_100%)]" />

        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          {tags.length ? tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              {tag}
            </span>
          )) : (
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              Journal
            </span>
          )}
        </div>

        <div className="relative z-10 p-6 text-white sm:p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
            {featured ? 'Featured story' : `${formatDate(blog.publishedAt || blog.createdAt)} · ${blog.readTime || estimateReadTime(blog.wordCount)} min read`}
          </p>
          <h2 className={`${featured ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'} max-w-2xl font-semibold tracking-[-0.04em] leading-[1.02]`}>
            {blog.title}
          </h2>
          <ul className="mt-5 space-y-2 text-sm leading-6 text-white/80 sm:text-[15px]">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition group-hover:bg-teal-300">
            Read article <span aria-hidden="true">→</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function BlogListClient({ initialTag = '' }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new');
  const [activeTag] = useState(initialTag);

  const sentinelRef = useRef(null);

  const fetchPage = useCallback(async (pageNum) => {
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_SIZE));
    params.set('page', String(pageNum));
    if (activeTag) params.set('tag', activeTag);

    const res = await fetch(`/api/blogs?${params.toString()}`, { credentials: 'include' });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    if (!isJson) throw new Error('Unexpected response');
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.blogs || []);
    const total = Array.isArray(data) ? undefined : data.total;
    return { list, total };
  }, [activeTag]);

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

  const discoveredTags = useMemo(() => {
    const s = new Set();
    blogs.forEach((b) => (b.tags || []).forEach((t) => s.add(String(t))));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [blogs]);

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

  const itemListJsonLd = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.findtrustedcleaners.com';
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: filtered.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${base}/blog/${normaliseSlug(b.slug || '')}`,
        name: b.title,
      })),
    };
  }, [filtered]);

  const featured = filtered[0];
  const rest = featured ? filtered.slice(1) : filtered;
  const swipePosts = rest.slice(0, 8);

  return (
    <main className="min-h-screen bg-[#f3eee6] text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <Image
            src={featured ? getImage(featured, 0) : '/background.jpg'}
            alt="FindTrustedCleaners magazine"
            fill
            className="object-cover opacity-45"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.86)_0%,rgba(2,6,23,0.58)_44%,rgba(2,6,23,0.22)_100%)]" />
        </div>
        <div className="relative mx-auto grid min-h-[64vh] max-w-7xl items-end px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-teal-200">
              {activeTag ? `FindTrustedCleaners Magazine · ${activeTag}` : 'FindTrustedCleaners Magazine'}
            </p>
            <h1 className="text-5xl font-semibold tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              {activeTag ? `Stories about ${activeTag}` : 'Better homes, calmer choices.'}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              Image-led cleaning guides, simple decisions and practical advice without the spammy blog feel.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2rem] border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="search"
              placeholder="Search the magazine..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-full border border-slate-950/10 bg-white/80 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-slate-950/10 bg-white/80 px-5 py-3 text-sm"
            >
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>

        {discoveredTags.length > 0 && (
          <div className="mb-8 flex snap-x gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/blog" className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${!activeTag ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-950/10 bg-white/70 text-slate-800'}`}>
              All
            </Link>
            {discoveredTags.map((t) => (
              <Link key={t} href={`/blog/tag/${encodeURIComponent(t)}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${activeTag === t ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-950/10 bg-white/70 text-slate-800'}`}>
                {t}
              </Link>
            ))}
          </div>
        )}

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-600/20 border-t-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-black/5 bg-white/70 p-10 text-center shadow-sm">
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">No stories found</h2>
            <p className="mt-3 text-slate-600">Try a different search or browse all articles.</p>
          </div>
        ) : (
          <>
            {featured && (
              <section className="mb-16 grid gap-7 lg:grid-cols-[1.55fr_0.75fr]">
                <MagazineCard blog={featured} index={0} featured />
                <div className="flex flex-col justify-between rounded-[2rem] border border-black/5 bg-white/60 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">Magazine mode</p>
                    <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Big image. Small text. Clear choice.</h2>
                    <p className="mt-5 text-lg leading-8 text-slate-700">Articles now scan like editorial cards, not a plain directory feed.</p>
                  </div>
                  <div className="mt-8 border-t border-slate-950/10 pt-6 text-sm leading-6 text-slate-600">
                    Search and tags remain for usability and SEO, but the page feels calmer and more premium.
                  </div>
                </div>
              </section>
            )}

            {swipePosts.length > 0 && (
              <section className="mb-16">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">Swipe to read</p>
                    <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Next articles</h2>
                  </div>
                </div>
                <div className="flex snap-x gap-5 overflow-x-auto pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {swipePosts.map((blog, index) => (
                    <div key={`swipe-${blog._id || blog.slug}`} className="w-[82vw] shrink-0 snap-start sm:w-[420px]">
                      <MagazineCard blog={blog} index={index + 1} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">Latest issue</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950">All stories</h2>
            </section>

            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((blog, index) => <MagazineCard key={blog._id || blog.slug || index} blog={blog} index={index + 2} />)}
            </div>

            {hasMore && (
              <div ref={sentinelRef} className="flex h-20 items-center justify-center">
                {loadingMore ? <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600/20 border-t-teal-600" /> : null}
              </div>
            )}
          </>
        )}
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
    </main>
  );
}
