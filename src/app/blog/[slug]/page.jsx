import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const slug = params?.slug || "";
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} | FindTrustedCleaners`,
    description: `Cleaning guide: ${title}. Practical steps from FindTrustedCleaners.`,
  };
}

async function fetchPost(slug) {
  try {
    const res = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const json = await res.json();
    return json?.post || null;
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }) {
  const slug = params?.slug;
  const post = await fetchPost(slug);

  if (!post) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <article className="prose max-w-none">
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      {/* Optional AdSense block */}
      <div className="my-10">
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
    </main>
  );
}
