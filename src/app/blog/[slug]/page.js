import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';

export const dynamic = 'force-dynamic'; // Ensures fresh data on every request

export default async function BlogPostPage({ params }) {
  const { slug } = params;

  await connectToDatabase();
  const post = await BlogPost.findOne({ slug });

  if (!post) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <p>The blog post you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-8">Posted on {new Date(post.createdAt).toLocaleDateString()}</p>
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
}
