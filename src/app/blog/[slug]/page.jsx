// src/app/blog/[slug]/page.jsx
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";

export const runtime = "nodejs";
// If you want every blog post request to be fresh (recommended while editing):
export const dynamic = "force-dynamic";

function stripHtml(html = "") {
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCountFromHtml(html = "") {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

function readingTimeMinutes(words = 0) {
  // ~200 wpm
  return Math.max(1, Math.ceil(words / 200));
}

async function fetchPostBySlug(slug) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const url = `${base}/api/blogs?slug=${encodeURIComponent(slug)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = await res.json();
  return json?.post || null;
}

export async function generateMetadata({ params }) {
  const slug = params?.slug;
  if (!slug) return {};

  const post = await fetchPostBySlug(slug);
  if (!post) {
    return {
      title: "Post not found | FindTrustedCleaners Blog",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `https://www.findtrustedcleaners.com/blog/${post.slug}`;
  const description =
    (post.excerpt && post.excerpt.trim()) ||
    stripHtml(post.content || "").slice(0, 160);

  return {
    title: `${post.title} | FindTrustedCleaners Blog`,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      siteName: "FindTrustedCleaners",
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }) {
  const slug = params?.slug;
  if (!slug) return notFound();

  const post = await fetchPostBySlug(slug);
  if (!post) return notFound();

  const words = wordCountFromHtml(post.content || "");
  const readingTime = readingTimeMinutes(words);

  return (
    <BlogPostClient post={post} readingTime={readingTime} wordCount={words} />
  );
}