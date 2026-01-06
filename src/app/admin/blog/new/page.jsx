"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminBlogNewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get("edit");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const autoSlug = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    if (!slug) setSlug(autoSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlug]);

  // Minimal “edit” support: fetch by listing all posts and picking the ID
  useEffect(() => {
    const run = async () => {
      if (!editId) return;
      setLoading(true);
      try {
        const res = await fetch("/api/blogs", { cache: "no-store" });
        const json = await res.json();
        const post = (json?.posts || []).find((p) => p._id === editId);
        if (!post) {
          setMsg("Could not find post to edit.");
          setLoading(false);
          return;
        }
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setExcerpt(post.excerpt || "");
        setContent(post.content || "");
      } catch {
        setMsg("Failed to load post for editing.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [editId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const method = editId ? "PUT" : "POST";
      const body = editId
        ? { id: editId, title, slug, excerpt, content }
        : { title, slug, excerpt, content };

      const res = await fetch("/api/blogs", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg(data?.message || "Save failed");
        setLoading(false);
        return;
      }

      router.push("/admin/blog");
    } catch {
      setMsg("Save error");
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{editId ? "Edit Post" : "New Post"}</h1>
      <p className="text-gray-600 mb-8">
        Content can be HTML (simple). Later we can add a proper editor.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full p-3 rounded-xl border"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          className="w-full p-3 rounded-xl border font-mono"
          placeholder="slug-like-this"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />

        <input
          className="w-full p-3 rounded-xl border"
          placeholder="Excerpt (optional)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />

        <textarea
          className="w-full p-3 rounded-xl border min-h-[280px] font-mono"
          placeholder="Content (HTML). Example: <p>Hello</p><h2>Section</h2>"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <div className="flex gap-3">
          <button
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            className="px-5 py-3 rounded-xl border hover:bg-white/60"
            onClick={() => router.push("/admin/blog")}
          >
            Cancel
          </button>
        </div>

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
      </form>
    </main>
  );
}
