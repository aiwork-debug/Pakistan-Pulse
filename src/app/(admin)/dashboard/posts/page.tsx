import type { Metadata } from "next";
import { clsx } from "clsx";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { PostsTable } from "@/components/dashboard/posts-table";
import { CategoryPills } from "@/components/feed/category-pills";
import { EmptyState } from "@/components/feed/empty-state";
import { getAdminPosts } from "@/lib/dashboard-data";
import { requirePageRole } from "@/lib/session";
import type { PostStatus } from "@/lib/types";
import { buttonPrimary } from "@/lib/ui";

export const metadata: Metadata = {
  title: "My posts",
  robots: { index: false, follow: false },
};

type AdminPostsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTERS: { label: string; status: PostStatus | null }[] = [
  { label: "All", status: null },
  { label: "Draft", status: "DRAFT" },
  { label: "Published", status: "PUBLISHED" },
  { label: "Archived", status: "ARCHIVED" },
];

function parseStatus(value: string | string[] | undefined): PostStatus | null {
  const raw = (Array.isArray(value) ? value[0] : value)?.toUpperCase();
  return raw === "DRAFT" || raw === "PUBLISHED" || raw === "ARCHIVED" ? raw : null;
}

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const session = await requirePageRole("ADMIN");

  const status = parseStatus((await searchParams).status);
  const posts = await getAdminPosts(session, status ?? undefined);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-sans text-2xl font-semibold text-ink">My posts</h1>
          <p className="text-sm text-muted">Every story you have written, in all statuses.</p>
        </div>
        <Link href="/dashboard/posts/new" className={clsx(buttonPrimary, "w-fit")}>
          <Plus aria-hidden="true" className="size-4" />
          New story
        </Link>
      </header>

      <CategoryPills
        label="Filter by status"
        items={FILTERS.map((filter) => ({
          label: filter.label,
          href: filter.status ? `/dashboard/posts?status=${filter.status.toLowerCase()}` : "/dashboard/posts",
          active: filter.status === status,
        }))}
      />

      {posts.length > 0 ? (
        <PostsTable posts={posts} caption="Your posts, most recently updated first" />
      ) : (
        <EmptyState
          icon={FileText}
          title={status ? `No ${status.toLowerCase()} stories` : "No stories yet"}
          description="Stories you create appear here."
          action={{ href: "/dashboard/posts/new", label: "New story" }}
        />
      )}
    </div>
  );
}
