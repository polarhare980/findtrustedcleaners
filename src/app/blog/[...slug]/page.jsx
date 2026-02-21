import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

const POSTS = {
  "end-of-tenancy-cleaning-checklist": () =>
    import("../posts/end-of-tenancy-cleaning-checklist"),
  "how-to-hire-a-cleaner": () => import("../posts/how-to-hire-a-cleaner"),
};

function getSlug(params) {
  // params.slug for [...slug] is ALWAYS an array
  const arr = Array.isArray(params?.slug) ? params.slug : [];
  const joined = arr.join("/");

  // Handle /blog/blog/<slug>
  const cleaned = joined.startsWith("blog/") ? joined.slice(5) : joined;

  return cleaned
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

async function findDbPostBySlug(slug) {
  const candidates = [slug, `blog/${slug}`, `/blog/${slug}`];
  return BlogPost.findOne({ slug: { $in: candidates } }).lean();
}

export default async function BlogPostPage({ params }) {
  const slug = getSlug(params);

  // ✅ TEMP DEBUG: if slug is empty, show it instead of 404
  if (!slug) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold">DEBUG: slug empty</h1>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </main>
    );
  }

  // 1) Static post
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

  // ✅ TEMP DEBUG: show slug if DB lookup fails
  if (!post) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold">DEBUG: post not found</h1>
        <p>Slug resolved to:</p>
        <pre>{slug}</pre>
        <p>Params:</p>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      {post.excerpt ? <p className="text-gray-600 mb-6">{post.excerpt}</p> : null}
      <div className="prose max-w-none whitespace-pre-wrap">{post.content}</div>
    </main>
  );
}