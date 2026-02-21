import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";

export const metadata = {
  title: "Cleaning Tips & Guides | FindTrustedCleaners Blog",
  description:
    "Expert cleaning tips, checklists, and practical guides from FindTrustedCleaners.",
  alternates: { canonical: "https://www.findtrustedcleaners.com/blog" },
  openGraph: {
    title: "FindTrustedCleaners Blog",
    description: "Cleaning tips, checklists, and practical guides.",
    url: "https://www.findtrustedcleaners.com/blog",
    siteName: "FindTrustedCleaners",
    type: "website",
  },
  robots: { index: true, follow: true },
};

// Static posts (React components under /blog/posts)
const STATIC_POSTS = [
  {
    slug: "end-of-tenancy-cleaning-checklist",
    title: "End of Tenancy Cleaning Checklist",
    blurb: "A practical checklist you can use room-by-room.",
    type: "static",
  },
  {
    slug: "how-to-hire-a-cleaner",
    title: "How to Hire a Cleaner",
    blurb: "What to ask, what to avoid, and how to pick the right fit.",
    type: "static",
  },
];

async function fetchDbPosts() {
  try {
    await connectToDatabase();

    const posts = await BlogPost.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Ensure serialisable data
    return posts.map((p) => ({
      ...p,
      _id: p._id?.toString?.() || "",
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
    }));
  } catch (err) {
    console.error("❌ BlogIndexPage failed to load DB posts:", err?.message);
    return [];
  }
}

export default async function BlogIndexPage() {
  const dbPosts = await fetchDbPosts();

  const combined = [
    ...STATIC_POSTS.map((p) => ({
      ...p,
      href: `/blog/${p.slug}`,
      key: `static-${p.slug}`,
    })),
    ...dbPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      blurb: p.excerpt || "",
      href: `/blog/${p.slug}`,
      key: p._id || `db-${p.slug}`,
      type: "db",
      createdAt: p.createdAt,
    })),
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Cleaning Tips &amp; Guides</h1>
      <p className="text-gray-600 mb-8">
        Short, useful cleaning guides designed to rank and help customers.
      </p>

      {/* Optional AdSense block (safe if you don’t have ID yet) */}
      <div className="mb-8">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || ""}
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
          }}
        />
      </div>

      {combined.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/40 backdrop-blur border border-white/40">
          <p className="text-gray-700 font-medium mb-2">
            No posts yet (but the page is working).
          </p>
          <p className="text-gray-600">
            Once you add your first post in <span className="font-mono">/admin</span>,
            it’ll show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {combined.map((p) => (
            <li
              key={p.key}
              className="p-4 rounded-2xl bg-white/40 backdrop-blur border border-white/40 hover:bg-white/55 transition"
            >
              <Link href={p.href} className="text-teal-700 hover:underline font-semibold">
                {p.title}
              </Link>
              {p.blurb ? <p className="text-gray-600 mt-1">{p.blurb}</p> : null}
              <div className="text-xs text-gray-500 mt-2">
                {p.type === "static" ? "Static guide" : "Blog post"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}