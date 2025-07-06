'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        const data = await res.json();
        setBlogs(data);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) return <p>Loading blogs...</p>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Our Blog</h1>
      {blogs.length === 0 ? (
        <p>No blog posts yet.</p>
      ) : (
        <ul className="space-y-4">
          {blogs.map((blog) => (
            <li key={blog._id} className="border p-4 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-2">{blog.title}</h2>
              <Link href={`/blog/${blog.slug}`} className="text-blue-500 hover:underline">
                Read More
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
