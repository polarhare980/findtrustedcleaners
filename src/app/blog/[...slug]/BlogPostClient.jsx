'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// --- tiny helpers ---
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ✅ Decode HTML entities (&lt;h1&gt; etc) into real HTML
// This is the missing step when DB content is stored as escaped text.
const decodeHtmlEntities = (str = '') => {
  if (typeof window === 'undefined') return str;
  // Fast + reliable decode
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
};

// Very light HTML clean: remove <script> and obvious inline handlers.
// (Server-side sanitising is still recommended.)
const cleanHtml = (html = '') =>
  html
    // drop script/style completely
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1>/gi, '')
    // remove on* handlers (onload=, onclick=, etc.)
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    // remove javascript: URLs
    .replace(/\shref\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, ' href="#"')
    // lazy load images if not set
    .replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" ');

// Build a TOC from h2/h3, and ensure headings have IDs
const buildTocAndIds = (rawHtml = '') => {
  if (typeof window === 'undefined') return { html: rawHtml, toc: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const headings = Array.from(doc.querySelectorAll('h2, h3'));
  const toc = [];

  headings.forEach((h, i) => {
    if (!h.id) {
      const base = (h.textContent || `section-${i}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let id = base || `section-${i}`;
      let n = 2;
      while (doc.getElementById(id)) id = `${base}-${n++}`;
      h.id = id;
    }

    toc.push({
      id: h.id,
      text: h.textContent || '',
      level: h.tagName.toLowerCase(),
    });
  });

  return { html: doc.body.innerHTML, toc };
};

export default function BlogPostClient({ post, readingTime, wordCount }) {
  const progressRef = useRef(null);
  const articleRef = useRef(null);

  // ✅ initialise from decoded content
  const [html, setHtml] = useState(() => {
    const decoded = decodeHtmlEntities(post?.content || '');
    return cleanHtml(decoded);
  });

  const [toc, setToc] = useState([]);
  const [copied, setCopied] = useState(false);

  const canonicalUrl = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.href.split('#')[0];
    return `https://www.findtrustedcleaners.com/blog/${post?.slug || ''}`;
  }, [post?.slug]);

  // ✅ Prepare decoded + cleaned HTML + TOC
  useEffect(() => {
    const decoded = decodeHtmlEntities(post?.content || '');
    const cleaned = cleanHtml(decoded);
    const { html: withIds, toc } = buildTocAndIds(cleaned);
    setHtml(withIds);
    setToc(toc);
  }, [post?.content]);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      if (!articleRef.current || !progressRef.current) return;
      const el = articleRef.current;
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = Math.min(
        Math.max(window.scrollY - (el.offsetTop || 0), 0),
        total > 0 ? total : 1
      );
      const pct = Math.round((scrolled / (total || 1)) * 100);
      progressRef.current.style.width = `${pct}%`;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const Meta = ({ icon, text }) => (
    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
      <span aria-hidden>{icon}</span>
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );

  const ShareButton = ({ label, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener nofollow"
      className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
    >
      {label}
    </a>
  );

  const shareText = encodeURIComponent(post?.title || 'Great read');
  const shareUrl = encodeURIComponent(canonicalUrl);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // JSON-LD (Article + Breadcrumb)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post?.title,
    datePublished: post?.createdAt,
    dateModified: post?.updatedAt || post?.createdAt,
    wordCount: wordCount || undefined,
    timeRequired: readingTime ? `PT${Math.max(1, Math.round(readingTime))}M` : undefined,
    author: {
      '@type': 'Organization',
      name: 'FindTrustedCleaners',
      url: 'https://www.findtrustedcleaners.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FindTrustedCleaners',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.findtrustedcleaners.com/findtrusted-logo.png',
      },
    },
    mainEntityOfPage: canonicalUrl,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findtrustedcleaners.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findtrustedcleaners.com/blog' },
      { '@type': 'ListItem', position: 3, name: post?.title || 'Post', item: canonicalUrl },
    ],
  };

  return (
    <>
      {/* Reading progress */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[60]">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-teal-500 to-teal-700 transition-[width] duration-150 ease-out"
          style={{ width: '0%' }}
        />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="transition-transform duration-300 hover:scale-105">
              <img
                src="/findtrusted-logo.png"
                alt="FindTrustedCleaners Logo"
                className="w-32 h-auto"
                loading="eager"
                fetchPriority="high"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <div className="text-gray-700/80">
                <Link href="/" className="hover:text-teal-700">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/blog" className="hover:text-teal-700">Blog</Link>
                <span className="mx-2">/</span>
                <span className="text-teal-800 font-semibold line-clamp-1 max-w-[26ch] inline-block align-bottom">
                  {post?.title}
                </span>
              </div>

              <Link
                href="/blog"
                className="ml-4 text-teal-800 hover:text-teal-600 font-semibold transition-all duration-300 hover:scale-105"
              >
                ← Back to Blog
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 py-10">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-8 mb-8 animate-fadeIn">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4 leading-tight">
                {post?.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <Meta icon="📅" text={formatDate(post?.createdAt)} />
                <Meta icon="⏱️" text={`${Math.max(1, Math.round(readingTime || 1))} min read`} />
                <Meta icon="📝" text={`${(wordCount || 0).toLocaleString()} words`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-8 items-start">
            <article
              ref={articleRef}
              className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-8 animate-slideUp"
            >
              <div
                className="prose prose-lg max-w-none prose-headings:scroll-mt-24"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </article>

            <aside className="space-y-6">
              {toc?.length > 0 && (
                <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[16px] shadow p-5 sticky top-20">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">On this page</h3>
                  <nav className="text-sm leading-6">
                    <ul className="space-y-2">
                      {toc.map((item) => (
                        <li key={item.id} className={item.level === 'h3' ? 'ml-3' : ''}>
                          <a
                            href={`#${item.id}`}
                            className="text-gray-800 hover:text-teal-700 underline-offset-2 hover:underline"
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}

              <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[16px] shadow p-5">
                <h3 className="text-lg font-semibold text-teal-800 mb-4">Share this article</h3>
                <div className="grid grid-cols-2 gap-3">
                  <ShareButton
                    label="X (Twitter)"
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  />
                  <ShareButton
                    label="Facebook"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  />
                  <ShareButton
                    label="LinkedIn"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                  />
                  <ShareButton
                    label="WhatsApp"
                    href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
                  />
                  <button
                    onClick={copyLink}
                    className="col-span-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                    aria-live="polite"
                  >
                    {copied ? 'Link copied!' : 'Copy link'}
                  </button>
                </div>
              </div>

              <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[16px] shadow p-5">
                <h3 className="text-lg font-semibold text-teal-800 mb-3">Need a trusted cleaner?</h3>
                <p className="text-sm text-gray-800 mb-4">
                  Compare vetted cleaners near you. Transparent pricing and availability.
                </p>
                <Link
                  href="/find-cleaner"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  Browse cleaners →
                </Link>
              </div>
            </aside>
          </div>

          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-8 mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              <span>📚</span>
              Read more articles
            </Link>
          </div>
        </main>
      </div>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out both; }
        .animate-slideUp { animation: slideUp 0.4s ease-out both; }
      `}</style>
    </>
  );
}