import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import BlogPostClient from "./BlogPostClient";

export const dynamicParams = true;

const POSTS = {
  "end-of-tenancy-cleaning-checklist": () =>
    import("../posts/end-of-tenancy-cleaning-checklist"),
  "how-to-hire-a-cleaner": () => import("../posts/how-to-hire-a-cleaner"),
};

function normaliseSlug(slug) {
  return String(slug || "")
    .trim()
    .replace(/^\/+/, "") // remove leading /
    .replace(/^blog\/+/i, "") // remove leading blog/
    .replace(/^\/?blog\/+/i, "") // remove leading /blog/
    .replace(/\/+$/, ""); // remove trailing /
}

async function findDbPostBySlug(rawSlug) {
  const slug = normaliseSlug(rawSlug);

  // If older records were saved with blog/ prefix etc
  const candidates = [slug, `blog/${slug}`, `/blog/${slug}`];

  return BlogPost.findOne({ slug: { $in: candidates } }).lean();
}

// Only pre-render the static component posts
export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug: rawSlug } = await params; // ✅ Next 15/16 params is async
  const slug = normaliseSlug(rawSlug);

  // Static post metadata
  if (POSTS[slug]) {
    const mod = await POSTS[slug]();
    return {
      title: mod.meta?.title || "Blog post",
      description: mod.meta?.description,
      robots: { index: true, follow: true },
    };
  }

  // DB post metadata
  try {
    await connectToDatabase();
    const post = await findDbPostBySlug(slug);

    if (!post) return {};

    return {
      title: post.title || "Blog post",
      description: post.excerpt || "",
      robots: { index: true, follow: true },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }) {
  const { slug: rawSlug } = await params; // ✅ Next 15/16 params is async
  const slug = normaliseSlug(rawSlug);

  // 1) Static post component
  if (POSTS[slug]) {
    const mod = await POSTS[slug]();
    const Post = mod.default;

    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Post />
      </main>
    );
  }

  // 2) DB post
  await connectToDatabase();
  const post = await findDbPostBySlug(slug);

  if (!post) notFound();

  const contentText = String(post.content || "");
  const wordCount = contentText.trim()
    ? contentText.trim().split(/\s+/).length
    : 0;

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <BlogPostClient
      post={{
        ...post,
        _id: post._id?.toString?.() || "",
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : "",
      }}
      readingTime={readingTime}
      wordCount={wordCount}
    />
  );
}