"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toTagsArray(input) {
  return String(input || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function insertAtCursor(textarea, text) {
  if (!textarea) return;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  textarea.value = `${before}${text}${after}`;
  const pos = start + text.length;
  textarea.setSelectionRange(pos, pos);
  textarea.focus();
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const json = await res.json();
  if (!res.ok || !json?.success || !json?.url) {
    throw new Error(json?.message || "Upload failed");
  }
  return json.url;
}

export default function AdminBlogNewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get("edit");

  const contentRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(true);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

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
        setCoverImage(post.coverImage || "");
        setTags(Array.isArray(post.tags) ? post.tags.join(", ") : "");
        setPublished(post.published !== false);
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
        ? {
            id: editId,
            title,
            slug,
            excerpt,
            content,
            coverImage,
            tags: toTagsArray(tags),
            published,
          }
        : {
            title,
            slug,
            excerpt,
            content,
            coverImage,
            tags: toTagsArray(tags),
            published,
          };

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

  const handleCoverPick = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    setMsg("");
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
    } catch (e) {
      setMsg(e?.message || "Cover upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleInlinePick = async (file) => {
    if (!file) return;
    setUploadingInline(true);
    setMsg("");
    try {
      const url = await uploadImage(file);
      const html = `\n<img src="${url}" alt="" loading="lazy" />\n`;
      insertAtCursor(contentRef.current, html);
      setContent(contentRef.current.value);
    } catch (e) {
      setMsg(e?.message || "Image upload failed");
    } finally {
      setUploadingInline(false);
    }
  };

  const insertMarker = (marker) => {
    const html = `\n<!--AD:${marker}-->\n`;
    insertAtCursor(contentRef.current, html);
    setContent(contentRef.current.value);
  };

  return (
    <main className="max-w-5xl">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {editId ? "Edit Post" : "New Post"}
          </h1>
          <p className="text-gray-600">
            Keep it simple: write clean HTML, upload images, and drop ad markers where
            you want in-article AdSense.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="px-5 py-3 rounded-xl border hover:bg-white/60"
          >
            Back
          </button>
          <button
            form="blog-form"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 mt-8">
        <form id="blog-form" onSubmit={onSubmit} className="space-y-4">
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
            placeholder="Excerpt (shows under H1)"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />

          <textarea
            ref={contentRef}
            className="w-full p-3 rounded-xl border min-h-[520px] font-mono"
            placeholder={`Content (HTML).\n\nTip: use <h2> for sections.\nInsert ads with: <!--AD:in1--> or <!--AD:in2-->`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
        </form>

        {/* Right rail tools */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-2">Publishing</div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Published (show on /blog)
            </label>

            <div className="mt-4">
              <div className="text-sm font-semibold mb-1">Tags</div>
              <input
                className="w-full p-3 rounded-xl border"
                placeholder="e.g. end of tenancy, checklist"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                Comma-separated. These create the tag pills and tag pages.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-3">Cover image</div>

            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt=""
                className="w-full h-44 object-cover rounded-xl border"
              />
            ) : (
              <div className="w-full h-44 rounded-xl border bg-teal-50 flex items-center justify-center text-4xl">
                🧹
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <label className="px-4 py-2 rounded-xl border cursor-pointer hover:bg-gray-50 text-sm font-semibold">
                {uploadingCover ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(e) => handleCoverPick(e.target.files?.[0])}
                />
              </label>
              {coverImage ? (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
                  onClick={() => setCoverImage("")}
                >
                  Remove
                </button>
              ) : null}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Uses your existing Cloudinary upload route.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-3">Inline image</div>
            <p className="text-xs text-gray-500 mb-3">
              Upload an image and it will insert an <code>&lt;img&gt;</code> tag at
              your cursor.
            </p>

            <label className="px-4 py-2 rounded-xl border cursor-pointer hover:bg-gray-50 text-sm font-semibold inline-block">
              {uploadingInline ? "Uploading..." : "Upload & Insert"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingInline}
                onChange={(e) => handleInlinePick(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-3">Ad markers</div>
            <p className="text-xs text-gray-500 mb-3">
              These markers create in-article AdSense blocks without wrecking
              readability.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                onClick={() => insertMarker("in1")}
              >
                Insert in1
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                onClick={() => insertMarker("in2")}
              >
                Insert in2
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              If you don’t add markers, the renderer auto-inserts after a couple of
              paragraphs.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
