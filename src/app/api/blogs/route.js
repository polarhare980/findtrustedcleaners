import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';

export async function GET() {
  await connectToDatabase();
  const posts = await BlogPost.find().sort({ createdAt: -1 });
  return Response.json(posts);
}

export async function POST(req) {
  await connectToDatabase();
  const { title, slug, content } = await req.json();

  if (!title || !slug || !content) {
    return Response.json({ success: false, message: 'Missing fields' }, { status: 400 });
  }

  try {
    const newPost = new BlogPost({ title, slug, content });
    await newPost.save();

    return Response.json({ success: true, post: newPost });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: 'Error creating post' }, { status: 500 });
  }
}
