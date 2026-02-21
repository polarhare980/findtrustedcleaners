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

// params.slug will be an array, e.g. ["end-of-tenancy-cleaning-checklist"]
function slugFromParams(slugParam) {
  const parts = Array.isArray(slugParam) ? slugParam : [slugParam];

  // If someone hits /blog/blog/<slug>, drop the extra "blog"
  const cleaned = parts[0] === "blog" ? parts.slice(1) : parts;

  return cleaned
    .join("/")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^blog\/+/i, "")
    .replace(/^\/?blog\/+/i, "")
    .replace(/\/+$/, "");
}

async function findDbPostBySlug(slug) {
  const candidates = [slug, `blog/${slug}`, `/blog/${slug}`];
  return BlogPost.findOne({ slug: { $in: candidates } }).lean();
}

// Only pre-render static slugs (optional)
export async function generateStaticParams() {
  return Object.keys(POSTS).map((s) => ({ slug: [s] }));
}

export async function generateMetadata({ params }) {
  const slug = slugFromParams(params.slug);

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
    title: post.title || "Blog post",
    description: post.excerpt || "",
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }) {
  const slug = slugFromParams(params.slug);

  // Static post
  if (POSTS[slug]) {
    const mod = await POSTS[slug]();
    const Post = mod.default;

    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Post />
      </main>
    );
  }

  // DB post
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