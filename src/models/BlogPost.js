// src/models/BlogPost.js
import mongoose from "mongoose";

function slugify(input = "") {
  try {
    return decodeURIComponent(String(input))
      .trim()
      .toLowerCase()
      .replace(/^\/+/, "")
      .replace(/^blog\/+/i, "")
      .replace(/\/+$/, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  } catch {
    return String(input)
      .trim()
      .toLowerCase()
      .replace(/^\/+/, "")
      .replace(/^blog\/+/i, "")
      .replace(/\/+$/, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
}

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      set: slugify, // ✅ FORCE clean slug on save
    },

    excerpt: { type: String, default: "" },
    content: { type: String, default: "" }, // stored as HTML
    coverImage: { type: String, default: "" }, // URL or /uploads/... path
    tags: [{ type: String }],
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ALSO protect updates (not just .create())
BlogPostSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update?.slug) {
    update.slug = slugify(update.slug);
    this.setUpdate(update);
  }
  next();
});

export default mongoose.models.BlogPost ||
  mongoose.model("BlogPost", BlogPostSchema);