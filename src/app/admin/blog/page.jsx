import Link from "next/link";

async function fetchPosts() {
  try {
    const res = await fetch("/api/blogs", { cache: "no-store" });
    const json = await res.json();
    return Array.isArray(json?.posts) ? json.posts : [];
  } catch {
    return [];
  }
}

export default async function AdminBlogListPage() {
  const posts = await fetchPosts();

  return (
    <main>
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Blog Admin</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/blog/new"
            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
          >
            + New Post
          </Link>
          <form action="/api/admin/logout" method="post">
            <button className="px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black">
              Logout
            </button>
          </form>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/40 backdrop-blur border border-white/40">
          No posts yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li
              key={p._id}
              className="p-4 rounded-2xl bg-white/40 backdrop-blur border border-white/40 flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-xs text-gray-600">/{p.slug}</div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/blog/${p.slug}`}
                  className="px-3 py-2 rounded-xl border hover:bg-white/60"
                >
                  View
                </Link>
                <Link
                  href={`/admin/blog/new?edit=${p._id}`}
                  className="px-3 py-2 rounded-xl border hover:bg-white/60"
                >
                  Edit
                </Link>
                <DeleteButton id={p._id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function DeleteButton({ id }) {
  return (
    <form
      action={async () => {
        "use server";
      }}
    >
      {/* real delete button is client-side below */}
      <ClientDeleteButton id={id} />
    </form>
  );
}

// Inline client component (simple + reliable)
function ClientDeleteButton({ id }) {
  return (
    <button
      type="button"
      className="px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
      onClick={async () => {
        if (!confirm("Delete this post?")) return;
        const res = await fetch(`/api/blogs?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) location.reload();
        else alert("Delete failed");
      }}
    >
      Delete
    </button>
  );
}
