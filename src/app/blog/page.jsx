// src/app/blog/page.jsx
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Image from "next/image";
import Link from "next/link";
import AdSlot from "@/components/ads/AdSlot";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Magazine | Find Trusted Cleaners",
  description:
    "Interior-led cleaning stories, practical home guides and calm advice for finding the right cleaner.",
  alternates: {
    canonical: "/blog",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_IMAGES = [
  "/og-image.jpg",
  "/background.jpg",
  "/cleaner-illustration.png",
];

const STATIC_META = [
  {
    slug: "end-of-tenancy-cleaning-checklist",
    title: "End of Tenancy Cleaning Checklist",
    excerpt: "Everything you need to know to get your deposit back.",
    tags: ["end of tenancy", "checklist"],
    coverImage: null,
    createdAt: new Date("2024-01-15"),
    isStatic: true,
  },
  {
    slug: "how-to-hire-a-cleaner",
    title: "How to Hire a Cleaner",
    excerpt:
      "A step-by-step guide to finding and hiring the right cleaner for your home.",
    tags: ["guides", "hiring"],
    coverImage: null,
    createdAt: new Date("2024-02-01"),
    isStatic: true,
  },
];

function normaliseSlug(slug) {
  const raw = String(slug || "");
  try {
    return decodeURIComponent(raw)
      .trim()
      .replace(/^\/+/, "")
      .replace(/^blog\/+?/i, "")
      .replace(/^\/?blog\/+?/i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  } catch {
    return raw
      .trim()
      .replace(/^\/+/, "")
      .replace(/^blog\/+?/i, "")
      .replace(/^\/?blog\/+?/i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function displayDate(post) {
  const date = safeDate(post.createdAt) || safeDate(post.updatedAt);
  if (!date) return "Editorial guide";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function makeBullets(post) {
  if (Array.isArray(post.takeaways) && post.takeaways.length) {
    return post.takeaways.map((item) => cleanText(item)).filter(Boolean).slice(0, 3);
  }

  const source = cleanText(post.excerpt || post.description || post.content || "");
  if (!source) {
    return ["A calm, practical read for planning your next clean.", "Designed to help you choose with more confidence."];
  }

  const sentences = source
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/[.!?]+$/, "").trim())
    .filter(Boolean);

  if (sentences.length >= 2) return sentences.slice(0, 3);

  const words = source.split(" ").filter(Boolean);
  return [
    words.slice(0, 12).join(" "),
    words.slice(12, 26).join(" ") || "A quick editorial guide for cleaner home decisions",
  ].filter(Boolean);
}

function getImage(post, index = 0) {
  return post.coverImage || post.image || post.heroImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

async function getDbPosts() {
  try {
    await connectToDatabase();
    const posts = await BlogPost.find({ published: { $ne: false } })
      .sort({ createdAt: -1 })
      .lean();
    return posts || [];
  } catch {
    return [];
  }
}

function MagazineCard({ post, index, featured = false }) {
  const hrefSlug = post._listSlug || normaliseSlug(post.slug);
  const image = getImage(post, index);
  const bullets = makeBullets(post);
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 2) : [];

  return (
    <Link
      href={`/blog/${hrefSlug}`}
      className={`group block overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.18)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_38px_110px_rgba(15,23,42,0.28)] ${featured ? "lg:min-h-[620px]" : "min-h-[460px]"}`}
    >
      <article className="relative flex h-full min-h-[inherit] flex-col justify-end overflow-hidden">
        <Image
          src={image}
          alt={post.title || "FindTrustedCleaners editorial article"}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
          sizes={featured ? "(max-width: 1024px) 100vw, 64vw" : "(max-width: 768px) 88vw, 34vw"}
          priority={featured}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.05)_0%,rgba(2,6,23,0.22)_38%,rgba(2,6,23,0.88)_100%)]" />
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">{featured ? "Featured story" : displayDate(post)}</p>
          <h2 className={`${featured ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"} max-w-2xl font-semibold tracking-[-0.04em] leading-[1.02]`}>
            {post.title}
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
      </article>
    </Link>
  );
}

export default async function BlogPage() {
  const dbPosts = await getDbPosts();

  const dbPostsForList = dbPosts.map((p) => {
    const date = safeDate(p.createdAt) || safeDate(p.updatedAt) || null;
    return {
      ...p,
      _listSlug: normaliseSlug(p.slug),
      _listDate: date || new Date(0),
    };
  });

  const staticForList = STATIC_META.map((p) => {
    const date = safeDate(p.createdAt) || new Date(0);
    return {
      ...p,
      _listSlug: normaliseSlug(p.slug),
      _listDate: date,
    };
  });

  const allPosts = [...dbPostsForList, ...staticForList].sort(
    (a, b) => new Date(b._listDate) - new Date(a._listDate)
  );

  const featuredPost = allPosts[0] || null;
  const remainingPosts = featuredPost ? allPosts.slice(1) : allPosts;
  const swipePosts = remainingPosts.slice(0, 8);

  const slots = {
    top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST_TOP || "",
    infeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST_INFEED || "",
  };

  return (
    <main className="min-h-screen bg-[#f3eee6] text-slate-950">
      <PublicHeader />

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <Image
            src={featuredPost ? getImage(featuredPost, 0) : "/background.jpg"}
            alt="FindTrustedCleaners magazine hero"
            fill
            className="object-cover opacity-45"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.86)_0%,rgba(2,6,23,0.58)_44%,rgba(2,6,23,0.22)_100%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[74vh] max-w-7xl items-end px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-teal-200">FindTrustedCleaners Magazine</p>
            <h1 className="text-5xl font-semibold tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              Better homes, calmer choices.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              Image-led guides for modern home life: cleaner homes, smarter booking decisions and practical advice without the spammy feel.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {slots.top ? (
          <div className="mb-10 overflow-hidden rounded-[1.75rem] border border-black/5 bg-white/55 p-3 shadow-sm backdrop-blur-xl">
            <AdSlot
              slot={slots.top}
              className="overflow-hidden rounded-[1.25rem] bg-white/70"
              style={{ minHeight: 90 }}
            />
          </div>
        ) : null}

        {allPosts.length === 0 ? (
          <div className="rounded-[2rem] border border-black/5 bg-white/70 p-8 text-slate-600 shadow-sm backdrop-blur-xl">No posts yet — check back soon.</div>
        ) : (
          <>
            {featuredPost ? (
              <section className="mb-16 grid gap-7 lg:grid-cols-[1.55fr_0.75fr]">
                <MagazineCard post={featuredPost} index={0} featured />
                <div className="flex flex-col justify-between rounded-[2rem] border border-black/5 bg-white/60 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">Editor&apos;s note</p>
                    <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-slate-950">No more spammy cleaning blog energy.</h2>
                    <p className="mt-5 text-lg leading-8 text-slate-700">
                      The blog now behaves more like a magazine cover: bigger imagery, shorter copy, stronger mood and simple article paths.
                    </p>
                  </div>
                  <div className="mt-8 border-t border-slate-950/10 pt-6 text-sm leading-6 text-slate-600">
                    Keep SEO in the structure. Let the visible design feel calm, premium and human.
                  </div>
                </div>
              </section>
            ) : null}

            {swipePosts.length ? (
              <section className="mb-16">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">Swipe to read</p>
                    <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Next articles</h2>
                  </div>
                  <p className="hidden max-w-xs text-right text-sm leading-6 text-slate-600 sm:block">A horizontal magazine rail for quick browsing on mobile and desktop.</p>
                </div>
                <div className="flex snap-x gap-5 overflow-x-auto pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {swipePosts.map((post, index) => (
                    <div key={`swipe-${post._id || post.slug}`} className="w-[82vw] shrink-0 snap-start sm:w-[420px]">
                      <MagazineCard post={post} index={index + 1} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">Latest issue</p>
                <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-slate-950">All stories</h2>
              </div>
            </section>

            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {remainingPosts.map((post, idx) => {
                const card = <MagazineCard post={post} index={idx + 2} />;
                if (slots.infeed && idx === 5) {
                  return (
                    <div key={`ad-and-${post._id || post.slug}`} className="contents">
                      <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white/55 p-3 shadow-sm backdrop-blur-xl">
                        <AdSlot slot={slots.infeed} className="w-full rounded-[1.5rem] bg-white/70" style={{ minHeight: 250 }} />
                      </div>
                      <div>{card}</div>
                    </div>
                  );
                }
                return <div key={`${post._id || post.slug}-${post._listSlug || post.slug}`}>{card}</div>;
              })}
            </div>
          </>
        )}
      </section>

      <PublicFooter />
    </main>
  );
}
