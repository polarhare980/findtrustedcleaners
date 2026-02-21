import mongoose from "mongoose";

const BlogPostSchema = new mongoose.Schema(
  {
    title: String,
    slug: String,
    excerpt: String,
    content: String,
  },
  { timestamps: true }
);

// 🟢 THIS prevents Vercel model overwrite crash
export default mongoose.models.BlogPost ||
  mongoose.model("BlogPost", BlogPostSchema);