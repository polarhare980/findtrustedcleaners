import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog | Find Trusted Cleaners",
  description:
    "Cleaning tips, guides and advice from the Find Trusted Cleaners team.",
};

// Static posts that live as code files
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

async function getDbPosts() {
  try {
    await connectToDatabase();
    const posts = await BlogPost.find({ published: { $ne: false } })
      .sort({ createdAt: -1 })
      .lean();
    return posts;
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const dbPosts = await getDbPosts();
  const allPosts = [...dbPosts, ...STATIC_META].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3">Cleaning Tips & Guides</h1>
        <p className="text-lg text-gray-600">
          Practical advice to help you find, hire, and get the most from
          professional cleaners.
        </p>
      </div>

      {allPosts.length === 0 ? (
        <p className="text-gray-500">No posts yet — check back soon!</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition-shadow"
            >
              {post.coverImage ? (
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                  <span className="text-5xl">🧹</span>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="font-bold text-lg mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                )}

                <div className="text-xs text-gray-400 mt-3">
                  {new Date(post.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}