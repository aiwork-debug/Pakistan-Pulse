import type { Metadata } from "next";
import { PostEditor } from "@/components/dashboard/post-editor";
import { getCategories } from "@/lib/data";
import { requirePageRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "New story",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  await requirePageRole("ADMIN");
  const categories = await getCategories();
  return <PostEditor post={null} categories={categories} />;
}
