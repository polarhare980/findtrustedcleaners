import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";

// ✅ Static imports (no dynamic import weirdness on Vercel)
import EndOfTenancy from "../posts/end-of-tenancy-cleaning-checklist";
import HireCleaner from "../posts/how-to-hire-a-cleaner";

export const dynamicParams = true;

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
  // Catch-all provides array: ["something"]
  const raw = Array.isArray(slug) ? slug.join("/") : String(slug || "");

  return decodeURIComponent(raw)
    .trim()
    .replace(/^\/+/, "")
    .replace(/^blog\/+/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

async function findDbPostBySlug(rawSlug) {
  const slug = normaliseSlug(rawSlug);

  return BlogPost.findOne({
    slug: { $in: [slug, `blog/${slug}`, `/blog/${slug}`] },
  }).lean();
}

// ✅ Catch-all param MUST be an array
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
  const post = await findDbPostBySlug(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt || "",
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }) {
  const slug = normaliseSlug(params?.slug);

  // ✅ Static post render
  if (STATIC_POSTS[slug]) {
    const Post = STATIC_POSTS[slug].Component;
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Post />
      </main>
    );
  }

  // ✅ DB post render
  await connectToDatabase();
  const post = await findDbPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      {post.excerpt ? <p className="text-gray-600 mb-6">{post.excerpt}</p> : null}
      <div className="prose max-w-none whitespace-pre-wrap">{post.content}</div>
    </main>
  );
}