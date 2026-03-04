// src/app/blog/[...slug]/page.jsx
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Image from "next/image";
import Link from "next/link";
import AdSlot from "@/components/ads/AdSlot";

// ✅ Static imports
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

/**
 * Finds a DB post by slug, tolerant of:
 * - case differences
 * - optional "blog/" prefix
 * - optional leading "/"
 * - optional trailing "/"
 *
 * Note: caller should ensure DB is connected.
 */
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

  // Build tolerant regexes that match the logical slug regardless of prefix/suffix
  const base = escapeRegex(slug);
  const tolerantRegex = new RegExp(`^(?:/)?(?:blog/)?${base}(?:/)?$`, "i");

  // Query: exact-ish matches OR tolerant regex match
  // (Exact-ish helps index usage when your DB slugs are normalised)
  return BlogPost.findOne({
    $or: [{ slug: { $in: unique } }, { slug: { $regex: tolerantRegex } }],
  }).lean();
}

export async function generateStaticParams() {
  return Object.keys(STATIC_POSTS).map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({ params }) {
  const slug = normaliseSlug(params?.slug);

  if (STATIC_POSTS[slug]) {
    const meta = STATIC_POSTS[slug].meta;
    return {
      title: meta?.title || "Blog post",
      description: meta?.description || "",
      robots: { index: true, follow: true },
    };
  }

  await connectToDatabase();

  const post = await findDbPostBySlug(params?.slug);
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
  // If the author already inserted markers, leave as-is.
  if (/<!--\s*AD:/i.test(html)) return html;

  // Very lightweight auto insertion: after 2nd and 6th paragraph close.
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
        <div
          key={`html-${key++}`}
          dangerouslySetInnerHTML={{ __html: before }}
        />
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
            className="rounded-2xl bg-white border shadow-sm overflow-hidden"
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
  const slug = normaliseSlug(params?.slug);

  // Static post render
  if (STATIC_POSTS[slug]) {
    const Post = STATIC_POSTS[slug].Component;
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Post />
      </main>
    );
  }

  // DB post render
  await connectToDatabase();

  const post = await findDbPostBySlug(params?.slug);

  // ✅ Prevent drafts/unpublished from being accessible publicly
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
    <article className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      {/* Top ad (keeps the layout flexible without harming readability) */}
      {slots.top ? (
        <div className="mb-8">
          <AdSlot
            slot={slots.top}
            className="rounded-2xl bg-white border shadow-sm overflow-hidden"
            style={{ minHeight: 90 }}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        {/* Main content */}
        <div className="min-w-0">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/blog" className="hover:text-teal-700">
                Blog
              </Link>
              <span className="text-gray-300">/</span>
              <span className="truncate">{post.title || "Blog post"}</span>
            </div>

            {/* Cover image */}
            {post.coverImage ? (
              <div className="relative w-full h-60 sm:h-72 md:h-[420px] mt-5 rounded-3xl overflow-hidden border bg-gray-100">
                <Image
                  src={post.coverImage}
                  alt={post.title || "Blog cover"}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 900px"
                />
              </div>
            ) : null}

            {/* Tags */}
            {post.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-6">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog/tag/${encodeURIComponent(tag)}`}
                    className="px-3 py-1 text-xs font-semibold bg-teal-100 text-teal-800 rounded-full hover:bg-teal-200 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            ) : null}

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4 leading-[1.05]">
              {post.title || "Blog post"}
            </h1>

            {post.excerpt ? (
              <p className="text-lg sm:text-xl text-gray-600 mt-4 leading-relaxed">
                {post.excerpt}
              </p>
            ) : null}

            {createdAt ? (
              <div className="text-sm text-gray-400 mt-4">
                {createdAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            ) : null}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

          {/* Article body (HTML) + in-article ads */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
              prose-a:text-teal-700 prose-a:underline hover:prose-a:text-teal-900
              prose-strong:text-gray-900
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-5
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-5
              prose-li:mb-2 prose-li:text-gray-700
              prose-img:rounded-2xl prose-img:shadow-md prose-img:my-8
              prose-blockquote:border-l-4 prose-blockquote:border-teal-500
              prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
              prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
          >
            {renderHtmlWithAdMarkers(post.content || "", slots)}
          </div>

          {/* Bottom ad */}
          {slots.bottom ? (
            <div className="mt-10">
              <AdSlot
                slot={slots.bottom}
                className="rounded-2xl bg-white border shadow-sm overflow-hidden"
                style={{ minHeight: 120 }}
              />
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="lg:pt-2">
          <div className="lg:sticky lg:top-24 space-y-6">
            {slots.sidebar ? (
              <AdSlot
                slot={slots.sidebar}
                className="rounded-2xl bg-white border shadow-sm overflow-hidden"
                style={{ minHeight: 600 }}
              />
            ) : null}

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="font-semibold">Want to book a cleaner?</div>
              <p className="text-sm text-gray-600 mt-1">
                Browse vetted cleaner profiles, see availability, and request a
                slot.
              </p>
              <Link
                href="/find-cleaner"
                className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
              >
                Find a cleaner
              </Link>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="font-semibold">For cleaners</div>
              <p className="text-sm text-gray-600 mt-1">
                Create a profile and start getting local enquiries.
              </p>
              <Link
                href="/cleaner/register"
                className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl border font-semibold hover:bg-gray-50"
              >
                Join as a cleaner
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}