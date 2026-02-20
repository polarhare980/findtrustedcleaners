import { notFound } from "next/navigation";

const POSTS = {
  "end-of-tenancy-cleaning-checklist": () => import("../posts/end-of-tenancy-cleaning-checklist"),
  "how-to-hire-a-cleaner": () => import("../posts/how-to-hire-a-cleaner"),
};

export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const loader = POSTS[params.slug];
  if (!loader) return {};
  const mod = await loader();

  return {
    title: mod.meta?.title || "Blog post",
    description: mod.meta?.description,
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }) {
  const loader = POSTS[params.slug];
  if (!loader) notFound();

  const mod = await loader();
  const Post = mod.default;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Post />
    </main>
  );
}