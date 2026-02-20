import { notFound } from "next/navigation";

export default async function BlogPostPage({ params }) {
  try {
    const Post = (await import(`./${params.slug}.mdx`)).default;
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Post />
      </main>
    );
  } catch (e) {
    notFound();
  }
}