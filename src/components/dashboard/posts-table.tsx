import { clsx } from "clsx";
import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatShortDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import { textLink } from "@/lib/ui";

type PostsTableProps = {
  posts: PostSummary[];
  caption: string;
};

export function PostsTable({ posts, caption }: PostsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-paper">
      <table className="w-full min-w-[680px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border bg-surface text-xs tracking-wider text-ink uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">
              Title
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Updated
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map((post) => (
            <tr key={post.id}>
              <th scope="row" className="px-5 py-4 font-medium text-ink">
                {post.title}
                {post.category ? <span className="block text-sm font-normal text-muted">{post.category.name}</span> : null}
              </th>
              <td className="px-5 py-4">
                <StatusBadge status={post.status} />
              </td>
              <td className="px-5 py-4 text-muted">
                <time dateTime={post.updatedAt}>{formatShortDate(post.updatedAt)}</time>
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-4">
                  <Link href={`/dashboard/posts/${post.id}`} className={clsx(textLink, "text-sm")}>
                    Edit<span className="sr-only"> {post.title}</span>
                  </Link>
                  {post.status === "PUBLISHED" ? (
                    <Link href={`/post/${post.slug}`} className={clsx(textLink, "text-sm")}>
                      View<span className="sr-only"> {post.title}</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted">
                      Not live<span className="sr-only">: {post.title}</span>
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
