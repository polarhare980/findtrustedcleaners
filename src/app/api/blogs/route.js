import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { protectApiRoute } from "@/lib/auth";

// GET - Fetch all posts OR a single post by slug
export async function GET(req) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const post = await BlogPost.findOne({ slug });
      if (!post) {
        return Response.json(
          { success: false, message: "Post not found" },
          { status: 404 }
        );
      }
      return Response.json({ success: true, post }, { status: 200 });
    }

    const posts = await BlogPost.find().sort({ createdAt: -1 });
    return Response.json({ success: true, posts }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching post(s):", err?.message);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new blog post (ADMIN ONLY)
export async function POST(req) {
  const { valid, response } = await protectApiRoute(req, "admin");
  if (!valid) return response;

  await connectToDatabase();
  const { title, slug, content, excerpt, coverImage, tags, published } = await req.json();

  if (!title || !slug || !content) {
    return Response.json(
      { success: false, message: "Missing required fields: title, slug, content" },
      { status: 400 }
    );
  }

  try {
    const newPost = new BlogPost({
      title,
      slug,
      content,
      excerpt: excerpt || "",
      coverImage: coverImage || "",
      tags: Array.isArray(tags) ? tags : [],
      published: published !== false,
    });
    await newPost.save();
    return Response.json({ success: true, post: newPost }, { status: 201 });
  } catch (err) {
    console.error("❌ Error creating post:", err?.message);
    if (err.code === 11000) {
      return Response.json(
        {
          success: false,
          message:
            "A post with this slug already exists. Please use a different slug.",
        },
        { status: 409 }
      );
    }
    return Response.json(
      { success: false, message: "Error creating post" },
      { status: 500 }
    );
  }
}

// PUT - Update a post (ADMIN ONLY)
export async function PUT(req) {
  const { valid, response } = await protectApiRoute(req, "admin");
  if (!valid) return response;

  await connectToDatabase();
  const { id, title, slug, content, excerpt, coverImage, tags, published } = await req.json();

  if (!id) {
    return Response.json({ success: false, message: "Missing id" }, { status: 400 });
  }

  try {
    const updated = await BlogPost.findByIdAndUpdate(
      id,
      {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(coverImage !== undefined && { coverImage }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
        ...(published !== undefined && { published: published !== false }),
      },
      { new: true }
    );

    if (!updated) {
      return Response.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    return Response.json({ success: true, post: updated }, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating post:", err?.message);
    return Response.json(
      { success: false, message: "Error updating post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a post (ADMIN ONLY)
export async function DELETE(req) {
  const { valid, response } = await protectApiRoute(req, "admin");
  if (!valid) return response;

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "Missing id" }, { status: 400 });
  }

  try {
    const deleted = await BlogPost.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ success: false, message: "Post not found" }, { status: 404 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Error deleting post:", err?.message);
    return Response.json(
      { success: false, message: "Error deleting post" },
      { status: 500 }
    );
  }
}