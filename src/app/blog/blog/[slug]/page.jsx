import { redirect } from "next/navigation";

export default function LegacyBlogRedirect({ params }) {
  redirect(`/blog/${params.slug}`);
}