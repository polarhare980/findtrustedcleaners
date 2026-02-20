// app/blog/[slug]/page.jsx

import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";

// TEMP DATA (replace later with MDX / DB)
const POSTS = {
  "end-of-tenancy-cleaning-checklist": {
    title: "End of Tenancy Cleaning Checklist",
    content: "Checklist content here...",
  },
  "how-to-hire-a-cleaner": {
    title: "How to Hire a Cleaner",
    content: "Hiring guide content here...",
  },
};

export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const post = POSTS[params.slug];

  if (!post) return {};

  return {
    title: post.title,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function BlogPostPage({ params }) {
  const post = POSTS[params.slug];

  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}