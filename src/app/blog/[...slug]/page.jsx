import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import MagazineArticleLayout from "@/components/MagazineArticleLayout";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

import EndOfTenancy from "../posts/end-of-tenancy-cleaning-checklist";
import HireCleaner from "../posts/how-to-hire-a-cleaner";

export const dynamicParams = true;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    .replace(/^blog\/+?/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compactText(value = "") {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBlogMeta(post = {}) {
  const title = compactText(post.metaTitle) || compactText(post.title) || "Blog post | Find Trusted Cleaners";
  const description =
    compactText(post.metaDescription) ||
    compactText(post.excerpt) ||
    compactText(post.content).slice(0, 155) ||
    "Cleaning advice, local hiring tips and trusted cleaner guidance from Find Trusted Cleaners.";

  return { title, description };
}

async function findDbPostBySlug(rawSlug) {
  const slug = normaliseSlug(rawSlug);

  const candidates = [
    slug,
    `blog/${slug}`,
    `/blog/${slug}`,
    `${slug}/`,
    `blog/${slug}/`,
    `/blog/${slug}/`,
    String(rawSlug || ""),
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);

  const unique = Array.from(new Set(candidates.map((s) => s.toLowerCase())));
  const base = escapeRegex(slug);
  const tolerantRegex = new RegExp(`^(?:/)?(?:blog/)?${base}(?:/)?$`, "i");

  return BlogPost.findOne({
    $or: [{ slug: { $in: unique } }, { slug: { $regex: tolerantRegex } }],
  }).lean();
}

export async function generateStaticParams() {
  return Object.keys(STATIC_POSTS).map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = normaliseSlug(resolvedParams?.slug);

  if (STATIC_POSTS[slug]) {
    const meta = STATIC_POSTS[slug].meta;
    return {
      title: meta?.title || "Blog post",
      description: meta?.description || "",
      alternates: { canonical: `https://www.findtrustedcleaners.com/blog/${slug}` },
      robots: { index: true, follow: true },
    };
  }

  await connectToDatabase();
  const post = await findDbPostBySlug(resolvedParams?.slug);
  if (!post || post.published === false) return {};

  const meta = buildBlogMeta(post);

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      url: `https://www.findtrustedcleaners.com/blog/${slug}`,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
    alternates: { canonical: `https://www.findtrustedcleaners.com/blog/${slug}` },
    robots: { index: true, follow: true },
  };
}



const LOCAL_CLUSTER_LINKS = {
  "worthing": [
    { href: "/blog/deep-cleaning-worthing-whats-included-costs", label: "Deep Cleaning in Worthing" },
    { href: "/blog/end-of-tenancy-cleaning-worthing-guide", label: "End of Tenancy Cleaning in Worthing" },
    { href: "/blog/weekly-cleaners-in-worthing-is-it-worth-it", label: "Weekly Cleaners in Worthing" },
    { href: "/blog/one-off-cleaning-services-worthing-explained", label: "One-Off Cleaning Services in Worthing" },
  ],
  "shoreham": [
    { href: "/blog/end-of-tenancy-cleaning-in-shoreham-by-sea", label: "End of Tenancy Cleaning in Shoreham-by-Sea" },
    { href: "/blog/deep-cleaning-in-shoreham-by-sea", label: "Deep Cleaning in Shoreham-by-Sea" },
    { href: "/blog/domestic-cleaning-services-in-shoreham-by-sea", label: "Domestic Cleaning Services in Shoreham-by-Sea" },
  ],
  "lancing": [
    { href: "/blog/weekly-cleaner-services-in-lancing", label: "Weekly Cleaner Services in Lancing" },
    { href: "/blog/deep-cleaning-in-lancing-local-guide", label: "Deep Cleaning in Lancing" },
    { href: "/blog/domestic-cleaning-services-in-lancing", label: "Domestic Cleaning Services in Lancing" },
  ],
  "chichester": [
    { href: "/blog/deep-cleaning-in-chichester-when-do-you-need-it", label: "Deep Cleaning in Chichester" },
    { href: "/blog/end-of-tenancy-cleaning-in-chichester-costs-checklist", label: "End of Tenancy Cleaning in Chichester" },
    { href: "/blog/domestic-cleaning-services-in-chichester", label: "Domestic Cleaning Services in Chichester" },
  ]
};

function buildLocalClusterLinks(slug = "") {
  const lower = String(slug || '').toLowerCase();
  const matched = Object.entries(LOCAL_CLUSTER_LINKS).find(([key]) => lower.includes(key));
  if (!matched) return '';

  const [, links] = matched;
  return `
<section class="related-guides">
  <h2>Related Local Cleaning Guides</h2>
  <ul>
    ${links.map(link => `<li><a href="${link.href}">${link.label}</a></li>`).join('')}
  </ul>
</section>`;
}

const GENERAL_RELATED_LINKS = `
<section class="related-guides">
  <h2>Useful cleaning links</h2>
  <ul>
    <li><a href="/cleaners">Find trusted cleaners near you</a></li>
    <li><a href="/services/domestic-cleaning">Domestic cleaning services</a></li>
    <li><a href="/services/deep-cleaning">Deep cleaning services</a></li>
    <li><a href="/services/end-of-tenancy-cleaning">End of tenancy cleaning</a></li>
    <li><a href="/locations/worthing">Cleaners in Worthing</a></li>
    <li><a href="/locations/littlehampton">Cleaners in Littlehampton</a></li>
  </ul>
</section>`;

const LITTLEHAMPTON_RELATED_GUIDES_HTML = `
<section class="related-guides">
  <h2>Related Guides</h2>
  <ul>
    <li><a href="https://www.findtrustedcleaners.com/blog/cleaners-littlehampton-prices">Cleaner prices in Littlehampton</a></li>
    <li><a href="https://www.findtrustedcleaners.com/blog/reliable-cleaner-littlehampton">How to find a reliable cleaner in Littlehampton</a></li>
    <li><a href="https://www.findtrustedcleaners.com/blog/what-do-cleaners-do-littlehampton">What do cleaners do in Littlehampton?</a></li>
  </ul>
</section>`;

function insertAfterFirstParagraph(html = "", addition = "") {
  if (!addition) return html;
  const content = String(html || "");
  const firstParagraphEnd = content.search(/<\/p>/i);
  if (firstParagraphEnd === -1) return `${addition}\n${content}`;
  const end = firstParagraphEnd + content.match(/<\/p>/i)[0].length;
  return `${content.slice(0, end)}\n${addition}\n${content.slice(end)}`;
}

function enhanceLittlehamptonBlogContent(html = "", slug = "") {
  const content = String(html || "");
  const isLittlehamptonBlog = String(slug || "").toLowerCase().includes("littlehampton");
  if (!isLittlehamptonBlog) return content;

  let enhanced = content;

  if (!/href=["']\/locations\/littlehampton["']/i.test(enhanced)) {
    enhanced = insertAfterFirstParagraph(
      enhanced,
      `<p>If you are comparing options locally, you can browse <a href="/locations/littlehampton">trusted cleaners in Littlehampton</a> and check which cleaners cover the services you need.</p>`
    );
  }

  const serviceIntroNeeded = !/href=["']\/services\/(domestic-cleaning|deep-cleaning|end-of-tenancy-cleaning|oven-cleaning|carpet-cleaning|window-cleaning|gutter-cleaning|pressure-washing)["']/i.test(enhanced);
  if (serviceIntroNeeded) {
    enhanced = insertAfterFirstParagraph(
      enhanced,
      `<p>Common local requests include <a href="/services/domestic-cleaning">domestic cleaning in Littlehampton</a>, <a href="/services/deep-cleaning">deep cleaning in Littlehampton</a>, <a href="/services/end-of-tenancy-cleaning">end of tenancy cleaning in Littlehampton</a>, and <a href="/services/oven-cleaning">oven cleaning in Littlehampton</a>.</p>`
    );
  }

  if (!/find cleaners in Littlehampton/i.test(enhanced)) {
    enhanced += `\n<p>When you are ready to compare local options, you can <a href="/locations/littlehampton">find cleaners in Littlehampton</a> and review profiles before making an enquiry.</p>`;
  }

  if (!/Related Guides/i.test(enhanced)) {
    enhanced += `\n${LITTLEHAMPTON_RELATED_GUIDES_HTML}`;
  }

  return enhanced;
}

function ensureBlogInternalLinks(html = "", slug = "") {
  const enhanced = enhanceLittlehamptonBlogContent(html, slug);
  if (/Useful cleaning links|Related Guides/i.test(enhanced)) return enhanced;
  return `${enhanced}
${buildLocalClusterLinks(slug)}
${GENERAL_RELATED_LINKS}`;
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function injectAutoAdMarkers(html = "") {
  if (/<!--\s*AD:/i.test(html)) return html;
  const parts = String(html).split(/(<\/p>)/i);
  if (parts.length < 6) return html;

  let pCount = 0;
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    out += parts[i];
    if (parts[i].toLowerCase() === "</p>") {
      pCount += 1;
      if (pCount === 2) out += "\n<!--AD:in1-->\n";
      if (pCount === 6) out += "\n<!--AD:in2-->\n";
    }
  }
  return out;
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const slug = normaliseSlug(resolvedParams?.slug);

  const slots = {
    top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_TOP || "",
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_SIDEBAR || "",
    in1: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_INARTICLE_1 || "",
    in2: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_INARTICLE_2 || "",
    bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_BOTTOM || "",
  };

  if (STATIC_POSTS[slug]) {
    const Post = STATIC_POSTS[slug].Component;
    const meta = STATIC_POSTS[slug].meta || {};
    const staticPost = {
      title: meta.title || slug.replace(/-/g, " "),
      excerpt: meta.description || "A practical cleaning guide from Find Trusted Cleaners.",
      slug,
      tags: ["Home Life"],
      coverImage: "/og-image.jpg",
      createdAt: new Date().toISOString(),
      content: meta.description || "",
    };

    return (
      <>
        <PublicHeader />
        <MagazineArticleLayout post={staticPost} slots={slots} readNextPosts={[]}>
          <Post />
        </MagazineArticleLayout>
        <PublicFooter />
      </>
    );
  }

  await connectToDatabase();
  const post = await findDbPostBySlug(resolvedParams?.slug);
  if (!post || post.published === false) notFound();

  const readNextPosts = await BlogPost.find({
    published: { $ne: false },
    _id: { $ne: post._id },
  })
    .sort({ createdAt: -1, updatedAt: -1 })
    .limit(8)
    .select("title slug excerpt description coverImage heroImage image imageAlt tags category createdAt updatedAt")
    .lean();

  const enhancedContent = injectAutoAdMarkers(
    ensureBlogInternalLinks(post.content || "", slug)
  );

  return (
    <>
      <PublicHeader />
      <MagazineArticleLayout
        post={post}
        slots={slots}
        readNextPosts={readNextPosts}
        contentHtml={enhancedContent}
      />
      <PublicFooter />
    </>
  );
}
