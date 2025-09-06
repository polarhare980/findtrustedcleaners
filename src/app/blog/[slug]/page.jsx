import { notFound } from 'next/navigation';

export async function generateMetadata({ params }){
  const slug = params.slug;
  const title = slug.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${title} — Cleaning Tips`,
    description: `Guide: ${title}. Practical steps from FindTrustedCleaners.`,
  };
}

async function fetchPost(slug){
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/blogs?slug=${slug}`, { cache: 'no-store' });
    const json = await res.json();
    return json?.post || null;
  } catch (e) {
    return null;
  }
}

export default async function BlogPostPage({ params }){
  const post = await fetchPost(params.slug);
  if (!post) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <article className="prose">
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      <div className="my-8">
        <ins className="adsbygoogle"
             style={{ display: "block" }}
             data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || ''}
             data-ad-slot="auto"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script dangerouslySetInnerHTML={{ __html: "(adsbygoogle = window.adsbygoogle || []).push({});" }}/>
      </div>
    </main>
  );
}
