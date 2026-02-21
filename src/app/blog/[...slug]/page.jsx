"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const STATIC_COMPONENTS = {
  "end-of-tenancy-cleaning-checklist": dynamic(
    () => import("../posts/end-of-tenancy-cleaning-checklist"),
    { ssr: false }
  ),
  "how-to-hire-a-cleaner": dynamic(() => import("../posts/how-to-hire-a-cleaner"), {
    ssr: false,
  }),
};

function normaliseSlugFromClient(params, pathname) {
  // useParams() for [...slug] usually gives { slug: ['a','b'] } but we guard hard
  const raw = params?.slug;

  let slug = "";
  if (Array.isArray(raw)) slug = raw.join("/");
  else if (typeof raw === "string") slug = raw;

  // Fallback: parse from URL path if params are missing
  if (!slug && typeof pathname === "string") {
    slug = pathname.replace(/^\/blog\/?/, "");
  }

  slug = String(slug || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^blog\/+/i, "") // handle /blog/blog/<slug>
    .replace(/\/+$/, "");

  return slug;
}

export default function BlogPostPage() {
  const params = useParams();
  const pathname = usePathname();

  const slug = useMemo(
    () => normaliseSlugFromClient(params, pathname),
    [params, pathname]
  );

  const StaticPost = slug ? STATIC_COMPONENTS[slug] : null;

  const [dbPost, setDbPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setDbPost(null);
      setNotFound(false);

      if (!slug) return;

      // If it's a static post, don't hit DB
      if (STATIC_COMPONENTS[slug]) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const json = await res.json();
        if (!cancelled) {
          if (json?.post) setDbPost(json.post);
          else setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      {/* Debug line (remove once confirmed working) */}
      <p className="text-xs text-gray-500 mb-4">
        Debug slug: <span className="font-mono">{slug || "(empty)"}</span>
      </p>

      {!slug ? (
        <div>
          <h1 className="text-2xl font-bold">Loading…</h1>
        </div>
      ) : StaticPost ? (
        <StaticPost />
      ) : loading ? (
        <div>
          <h1 className="text-2xl font-bold">Loading post…</h1>
        </div>
      ) : notFound ? (
        <div>
          <h1 className="text-2xl font-bold">Post not found</h1>
          <p className="text-gray-600 mt-2">
            If this is a DB post, check the saved slug matches:
            <span className="font-mono"> {slug}</span>
          </p>
        </div>
      ) : dbPost ? (
        <div>
          <h1 className="text-3xl font-bold mb-4">{dbPost.title}</h1>
          {dbPost.excerpt ? (
            <p className="text-gray-600 mb-6">{dbPost.excerpt}</p>
          ) : null}
          <div className="prose max-w-none whitespace-pre-wrap">{dbPost.content}</div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">Post not found</h1>
        </div>
      )}
    </main>
  );
}