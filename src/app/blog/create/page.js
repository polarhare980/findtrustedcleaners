'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BlogCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ Blog created successfully!');
        setTitle('');
        setSlug('');
        setContent('');
        router.push('/blog'); // Redirect to blog list
      } else {
        setMessage('❌ Failed to create blog.');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ An error occurred.');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Create New Blog Post</h1>
      {message && <p className="mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Blog Title"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Slug (e.g., how-to-clean-an-oven)"
          className="w-full p-2 border rounded"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <textarea
          placeholder="Blog Content (you can use HTML here)"
          className="w-full p-2 border rounded min-h-[200px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" className="bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600">
          Create Blog
        </button>
      </form>
    </div>
  );
}
