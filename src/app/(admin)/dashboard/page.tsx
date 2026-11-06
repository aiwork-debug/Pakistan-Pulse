import type { Metadata } from "next";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PostsTable } from "@/components/dashboard/posts-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { getAdminCounts, getAdminPosts } from "@/lib/dashboard-data";
import { requirePageRole } from "@/lib/session";
import { buttonPrimary, textLink } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await requirePageRole("ADMIN");

  const [counts, posts] = await Promise.all([getAdminCounts(session), getAdminPosts(session)]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-sans text-2xl font-semibold text-ink">Overview</h1>
          <p className="text-sm text-muted">Write, publish, and manage your own stories. No approval is needed.</p>
        </div>
        <Link href="/dashboard/posts/new" className={clsx(buttonPrimary, "w-fit")}>
          <Plus aria-hidden="true" className="size-4" />
          New story
        </Link>
      </header>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published" value={counts.published} />
        <StatCard label="Drafts" value={counts.drafts} />
        <StatCard label="Archived" value={counts.archived} />
        <StatCard label="Media files" value={counts.media} />
      </section>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold text-ink">
            Recently updated
          </h2>
          <Link href="/dashboard/posts" className={clsx(textLink, "text-sm")}>
            All my posts
          </Link>
        </div>
        {posts.length > 0 ? (
          <PostsTable posts={posts.slice(0, 5)} caption="Your five most recently updated posts" />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-paper p-8 text-center">
            <p className="font-serif text-xl font-semibold text-ink">No stories yet</p>
            <p className="mt-2 text-sm text-muted">Start your first story. You can publish it yourself when it is ready.</p>
          </div>
        )}
      </section>
    </div>
  );
}
