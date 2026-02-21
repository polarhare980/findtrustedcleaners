import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";

const POSTS = {
  "end-of-tenancy-cleaning-checklist": () => import("../posts/end-of-tenancy-cleaning-checklist"),
  "how-to-hire-a-cleaner": () => import("../posts/how-to-hire-a-cleaner"),
};

// Pre-render static posts only
export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const slug = params.slug;

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
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug }).lean();
  if (!post) return {};

  return {
    title: post.title || "Blog post",
    description: post.excerpt || "",
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }) {
  const slug = params.slug;

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
  const post = await BlogPost.findOne({ slug }).lean();

  if (!post) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

      {post.excerpt ? <p className="text-gray-600 mb-6">{post.excerpt}</p> : null}

      <div className="prose max-w-none whitespace-pre-wrap">
        {post.content}
      </div>
    </main>
  );
}