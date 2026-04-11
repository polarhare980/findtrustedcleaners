import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Image from "next/image";
import Link from "next/link";
import AdSlot from "@/components/ads/AdSlot";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

import EndOfTenancy from "../posts/end-of-tenancy-cleaning-checklist";
import HireCleaner from "../posts/how-to-hire-a-cleaner";

export const dynamicParams = true;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATIC_POSTS = {
  "end-of-tenancy-cleaning-checklist": {
    Component: EndOfTenancy,
    meta: EndOfTenancy?.meta,
  },
  "how-to-hire-a-cleaner": {
    Component: HireCleaner,
    meta: HireCleaner?.meta,
  },
};

function normaliseSlug(slug) {
  const raw = Array.isArray(slug) ? slug.join("/") : String(slug || "");
  return decodeURIComponent(raw)
    .trim()
    .replace(/^\/+/, "")
    .replace(/^blog\/+?/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDbPostBySlug(rawSlug) {
  const slug = normaliseSlug(rawSlug);

  const candidates = [
    slug,
    `blog/${slug}`,
    `/blog/${slug}`,
    `${slug}/`,
    `blog/${slug}/`,
    `/blog/${slug}/`,
    String(rawSlug || ""),
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);

  const unique = Array.from(new Set(candidates.map((s) => s.toLowerCase())));
  const base = escapeRegex(slug);
  const tolerantRegex = new RegExp(`^(?:/)?(?:blog/)?${base}(?:/)?$`, "i");

  return BlogPost.findOne({
    $or: [{ slug: { $in: unique } }, { slug: { $regex: tolerantRegex } }],
  }).lean();
}

export async function generateStaticParams() {
  return Object.keys(STATIC_POSTS).map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = normaliseSlug(resolvedParams?.slug);

  if (STATIC_POSTS[slug]) {
    const meta = STATIC_POSTS[slug].meta;
    return {
      title: meta?.title || "Blog post",
      description: meta?.description || "",
      robots: { index: true, follow: true },
    };
  }

  await connectToDatabase();
  const post = await findDbPostBySlug(resolvedParams?.slug);
  if (!post || post.published === false) return {};

  return {
    title: post.title || "Blog post",
    description: post.excerpt || "",
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
    robots: { index: true, follow: true },
  };
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function injectAutoAdMarkers(html = "") {
  if (/<!--\s*AD:/i.test(html)) return html;
  const parts = String(html).split(/(<\/p>)/i);
  if (parts.length < 6) return html;

  let pCount = 0;
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    out += parts[i];
    if (parts[i].toLowerCase() === "</p>") {
      pCount += 1;
      if (pCount === 2) out += "\n<!--AD:in1-->\n";
      if (pCount === 6) out += "\n<!--AD:in2-->\n";
    }
  }
  return out;
}

function renderHtmlWithAdMarkers(html = "", slots) {
  const withMarkers = injectAutoAdMarkers(html);
  const tokenRe = /<!--\s*AD:([a-z0-9_-]+)\s*-->/gi;
  const nodes = [];

  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = tokenRe.exec(withMarkers)) !== null) {
    const before = withMarkers.slice(lastIndex, match.index);
    if (before.trim()) {
      nodes.push(
        <div key={`html-${key++}`} dangerouslySetInnerHTML={{ __html: before }} />
      );
    }

    const token = String(match[1] || "").toLowerCase();
    const slot =
      token === "in1" || token === "in-article-1"
        ? slots.in1
        : token === "in2" || token === "in-article-2"
          ? slots.in2
          : token === "sidebar"
            ? slots.sidebar
            : token === "top"
              ? slots.top
              : token === "bottom"
                ? slots.bottom
                : null;

    if (slot) {
      nodes.push(
        <div key={`ad-${key++}`} className="not-prose my-8">
          <AdSlot
            slot={slot}
            className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            style={{ minHeight: 120 }}
          />
        </div>
      );
    }

    lastIndex = tokenRe.lastIndex;
  }

  const rest = withMarkers.slice(lastIndex);
  if (rest.trim()) {
    nodes.push(
      <div key={`html-${key++}`} dangerouslySetInnerHTML={{ __html: rest }} />
    );
  }

  return nodes;
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const slug = normaliseSlug(resolvedParams?.slug);

  if (STATIC_POSTS[slug]) {
    const Post = STATIC_POSTS[slug].Component;
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#f8fafc_100%)] text-slate-900">
        <PublicHeader />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/70 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
            <Post />
          </div>
        </div>
        <PublicFooter />
      </main>
    );
  }

  await connectToDatabase();
  const post = await findDbPostBySlug(resolvedParams?.slug);
  if (!post || post.published === false) notFound();

  const createdAt = safeDate(post.createdAt) || safeDate(post.updatedAt);

  const slots = {
    top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_TOP || "",
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_SIDEBAR || "",
    in1: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_INARTICLE_1 || "",
    in2: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_INARTICLE_2 || "",
    bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_BOTTOM || "",
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />

      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        {slots.top ? (
          <div className="mb-8">
            <AdSlot
              slot={slots.top}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ minHeight: 90 }}
            />
          </div>
        ) : null}

        <div className="mb-8 rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/blog" className="hover:text-teal-700">Blog</Link>
            <span>/</span>
            <span className="truncate">{post.title || 'Blog post'}</span>
          </div>

          {post.coverImage ? (
            <div className="relative mt-5 h-60 overflow-hidden rounded-[28px] border border-slate-200/70 bg-gray-100 sm:h-72 md:h-[420px]">
              <Image
                src={post.coverImage}
                alt={post.title || 'Blog cover'}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 900px"
              />
            </div>
          ) : null}

          {post.tags?.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-teal-100 bg-teal-50/90 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm transition hover:bg-teal-100"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-[1.05]">
            {post.title || 'Blog post'}
          </h1>

          {post.excerpt ? (
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              {post.excerpt}
            </p>
          ) : null}

          {createdAt ? (
            <div className="mt-5 text-sm text-slate-500">
              {createdAt.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              {[
                'Practical hiring advice',
                'Cleaner booking tips',
                'Clearer, easier articles',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-teal-100 bg-teal-50/80 px-4 py-3 text-sm font-medium text-teal-900">
                  {item}
                </div>
              ))}
            </div>

            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-5 prose-a:text-teal-700 prose-a:underline hover:prose-a:text-teal-900 prose-strong:text-slate-900 prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-5 prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-5 prose-li:mb-2 prose-li:text-slate-700 prose-img:rounded-2xl prose-img:shadow-md prose-img:my-8 prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
            >
              {renderHtmlWithAdMarkers(post.content || '', slots)}
            </div>

            {slots.bottom ? (
              <div className="mt-10">
                <AdSlot
                  slot={slots.bottom}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  style={{ minHeight: 120 }}
                />
              </div>
            ) : null}
          </div>

          <aside className="lg:pt-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {slots.sidebar ? (
                <AdSlot
                  slot={slots.sidebar}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  style={{ minHeight: 600 }}
                />
              ) : null}

              <div className="rounded-[28px] border border-white/70 bg-white/88 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Need a cleaner?</div>
                <div className="mt-2 text-xl font-bold text-slate-900">Browse local cleaner profiles</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Compare cleaner profiles, check availability, and send a request once you find the right fit.
                </p>
                <Link
                  href="/cleaners"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.24)] transition hover:bg-teal-700"
                >
                  Find a cleaner
                </Link>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white/88 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">For cleaners</div>
                <div className="mt-2 text-xl font-bold text-slate-900">Create your profile</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Join the marketplace, set your availability, and start getting local enquiries.
                </p>
                <Link
                  href="/register/cleaners"
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Join as a cleaner
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </article>

      <PublicFooter />
    </main>
  );
}
