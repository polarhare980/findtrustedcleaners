"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blogs", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setPosts(Array.isArray(json?.posts) ? json.posts : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const deletePost = async (id) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/blogs?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p._id !== id));
    else alert("Delete failed");
  };

  return (
    <main>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-gray-500 text-sm mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
        >
          + New Post
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border text-center text-gray-500">
          <p className="text-4xl mb-3">✍️</p>
          <p className="font-semibold">No posts yet</p>
          <p className="text-sm mt-1">Create your first blog post to get started.</p>
          <Link
            href="/admin/blog/new"
            className="mt-4 inline-block px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700"
          >
            Write First Post
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li
              key={p._id}
              className="p-4 rounded-2xl bg-white border flex items-center gap-4"
            >
              {/* Cover thumbnail */}
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverImage}
                  alt=""
                  className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-12 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🧹</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.title}</div>
                <div className="text-xs text-gray-500">/blog/{p.slug}</div>
                {p.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {p.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
                {new Date(p.createdAt).toLocaleDateString("en-GB")}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                >
                  View
                </Link>
                <Link
                  href={`/admin/blog/new?edit=${p._id}`}
                  className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deletePost(p._id)}
                  className="px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}