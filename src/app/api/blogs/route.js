import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { protectApiRoute } from '@/lib/auth';

// GET - Fetch all posts or a specific post by slug
export async function GET(req) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      const post = await BlogPost.findOne({ slug });

      if (!post) {
        return Response.json({ success: false, message: 'Post not found' }, { status: 404 });
      }

      return Response.json({ success: true, post }, { status: 200 });
    }

    // No slug: return all posts
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    return Response.json({ success: true, posts }, { status: 200 });

  } catch (err) {
    console.error('❌ Error fetching post(s):', err.message);
    return Response.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new blog post (admin only)
export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  await connectToDatabase();
  const { title, slug, content } = await req.json();

  if (!title || !slug || !content) {
    return Response.json({ success: false, message: 'Missing fields' }, { status: 400 });
  }

  try {
    const newPost = new BlogPost({ title, slug, content });
    await newPost.save();

    return Response.json({ success: true, post: newPost }, { status: 201 });
  } catch (err) {
    console.error('❌ Error creating post:', err.message);
    return Response.json({ success: false, message: 'Error creating post' }, { status: 500 });
  }
}
