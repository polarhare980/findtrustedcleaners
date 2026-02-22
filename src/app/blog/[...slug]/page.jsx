import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";

export const dynamicParams = true;

const POSTS = {
  "end-of-tenancy-cleaning-checklist": () =>
    import("../posts/end-of-tenancy-cleaning-checklist"),
  "how-to-hire-a-cleaner": () =>
    import("../posts/how-to-hire-a-cleaner"),
};

function normaliseSlug(slug) {
  // ✅ Catch-all routes provide slug as an array: ["a", "b"]
  const raw = Array.isArray(slug) ? slug.join("/") : String(slug || "");

  return raw
    .trim()
    .replace(/^\/+/, "")
    .replace(/^blog\/+/i, "")
    .replace(/\/+$/, "");
}

async function findDbPostBySlug(rawSlug) {
  const slug = normaliseSlug(rawSlug);

  return BlogPost.findOne({
    slug: { $in: [slug, `blog/${slug}`, `/blog/${slug}`] },
  }).lean();
}

// ✅ IMPORTANT: catch-all param MUST be an array
export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({ params }) {
  const rawSlug = params?.slug; // ✅ no await
  const slug = normaliseSlug(rawSlug);

  if (POSTS[slug]) {
    const mod = await POSTS[slug]();
    return {
      title: mod.meta?.title || "Blog post",
      description: mod.meta?.description,
      robots: { index: true, follow: true },
    };
  }

  await connectToDatabase();
  const post = await findDbPostBySlug(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt || "",
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }) {
  const rawSlug = params?.slug; // ✅ no await
  const slug = normaliseSlug(rawSlug);

  // Static
  if (POSTS[slug]) {
    const mod = await POSTS[slug]();
    const Post = mod.default;

    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Post />
      </main>
    );
  }

  // DB
  await connectToDatabase();
  const post = await findDbPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

      {post.excerpt && <p className="text-gray-600 mb-6">{post.excerpt}</p>}

      <div className="prose max-w-none whitespace-pre-wrap">{post.content}</div>
    </main>
  );
}