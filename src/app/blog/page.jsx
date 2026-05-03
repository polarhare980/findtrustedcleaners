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
  title: "Blog | Find Trusted Cleaners",
  description:
    "Cleaning tips, guides and advice from the Find Trusted Cleaners team.",
  alternates: {
    canonical: '/blog',
  },
  robots: {
    index: true,
    follow: true,
  },
};

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

  const slots = {
    top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST_TOP || "",
    infeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST_INFEED || "",
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#f8fafc_42%,#f8fafc_100%)] text-slate-900">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_32%),linear-gradient(135deg,#f8fffe_0%,#eefcf9_48%,#ffffff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-[32px] border border-white/70 bg-white/84 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">FindTrustedCleaners blog</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Cleaning tips, booking advice, and practical guides</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Make the blog feel more premium, easier to scan, and more useful for people deciding how to book the right cleaner.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {slots.top ? (
          <div className="mb-10">
            <AdSlot
              slot={slots.top}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ minHeight: 90 }}
            />
          </div>
        ) : null}

        {allPosts.length === 0 ? (
          <div className="rounded-[28px] border border-white/70 bg-white/88 p-8 text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">No posts yet — check back soon.</div>
        ) : (
          <>
            {featuredPost ? (
              <section className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Link
                  href={`/blog/${featuredPost._listSlug}`}
                  className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl"
                >
                  <div className="relative h-72 bg-gradient-to-br from-teal-50 to-teal-100 sm:h-[380px]">
                    {featuredPost.coverImage ? (
                      <Image
                        src={featuredPost.coverImage}
                        alt={featuredPost.title || 'Featured blog post'}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        priority
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">🧽</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/30 to-transparent" />
                  </div>
                </Link>

                <div className="flex h-full flex-col justify-center rounded-[32px] border border-white/70 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Featured article</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{featuredPost.title}</h2>
                  {featuredPost.excerpt ? <p className="mt-4 text-lg leading-8 text-slate-600">{featuredPost.excerpt}</p> : null}
                  {featuredPost.tags?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {featuredPost.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full border border-teal-100 bg-teal-50/90 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-6 text-sm text-slate-500">
                    {(safeDate(featuredPost.createdAt) || safeDate(featuredPost.updatedAt))?.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="mt-8">
                    <span className="inline-flex rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.25)] transition group-hover:bg-teal-700">Read article</span>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Latest posts</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Browse the rest of the blog</h2>
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {remainingPosts.map((post, idx) => {
                const hrefSlug = post._listSlug || normaliseSlug(post.slug);
                const displayDate = safeDate(post.createdAt) || safeDate(post.updatedAt);

                if (slots.infeed && idx === 5) {
                  return (
                    <div
                      key="infeed-ad"
                      className="flex items-center justify-center overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                    >
                      <AdSlot slot={slots.infeed} className="w-full" style={{ minHeight: 250 }} />
                    </div>
                  );
                }

                return (
                  <Link
                    key={`${post._id || post.slug}-${hrefSlug}`}
                    href={`/blog/${hrefSlug}`}
                    className="group flex flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                  >
                    {post.coverImage ? (
                      <div className="relative h-52 bg-gray-100">
                        <Image
                          src={post.coverImage}
                          alt={post.title || 'Blog post'}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100 text-5xl">🧹</div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      {post.tags?.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full border border-teal-100 bg-teal-50/90 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-teal-700 line-clamp-2">
                        {post.title}
                      </h3>

                      {post.excerpt ? (
                        <p className="mt-3 flex-1 text-sm leading-7 text-slate-600 line-clamp-3">{post.excerpt}</p>
                      ) : null}

                      {displayDate ? (
                        <div className="mt-5 text-sm text-slate-500">
                          {displayDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      <PublicFooter />
    </main>
  );
}
