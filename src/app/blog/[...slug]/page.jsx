import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Image from "next/image";

// ✅ Static imports
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
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }) {
  const slug = normaliseSlug(params?.slug);

  // Static post render
  if (STATIC_POSTS[slug]) {
    const Post = STATIC_POSTS[slug].Component;
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Post />
      </main>
    );
  }

  // DB post render
  await connectToDatabase();
  const post = await findDbPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-2xl overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <a
              key={tag}
              href={`/blog/tag/${encodeURIComponent(tag)}`}
              className="px-3 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full hover:bg-teal-200 transition-colors"
            >
              {tag}
            </a>
          ))}
        </div>
      )}

      <h1 className="text-4xl font-bold mb-3 leading-tight">{post.title}</h1>

      {post.excerpt && (
        <p className="text-lg text-gray-600 mb-4 leading-relaxed">
          {post.excerpt}
        </p>
      )}

      <div className="text-sm text-gray-400 mb-8">
        {new Date(post.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>

      <hr className="mb-8 border-gray-200" />

      {/* ✅ Render HTML content properly */}
      <div
        className="prose prose-lg max-w-none
          prose-headings:font-bold prose-headings:text-gray-900
          prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-teal-600 prose-a:underline hover:prose-a:text-teal-800
          prose-strong:text-gray-900
          prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
          prose-li:mb-1 prose-li:text-gray-700
          prose-img:rounded-xl prose-img:shadow-md prose-img:my-6
          prose-blockquote:border-l-4 prose-blockquote:border-teal-500
          prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
          prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}