import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/dashboard/post-editor";
import { getEditablePost } from "@/lib/dashboard-data";
import { getCategories } from "@/lib/data";
import { requirePageRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit story",
  robots: { index: false, follow: false },
};

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const session = await requirePageRole("ADMIN");

  const [post, categories] = await Promise.all([getEditablePost(session, id), getCategories()]);
  if (!post) notFound();

  // key: remount the editor when switching between posts.
  return <PostEditor key={post.id} post={post} categories={categories} />;
}
