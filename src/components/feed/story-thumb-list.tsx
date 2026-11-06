"use client";

import { clsx } from "clsx";
import { Expand } from "lucide-react";
import { useState } from "react";
import { StoryPreviewDialog } from "@/components/feed/story-preview-dialog";
import { CoverImage } from "@/components/ui/cover-image";
import { formatDayTime } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import { focusRing, kicker } from "@/lib/ui";

type StoryThumbListProps = {
  posts: PostSummary[];
};

/**
 * Sidebar-style column of top stories: a small thumbnail with the headline beside it.
 * Pressing a row opens the story in a popup preview instead of leaving the page.
 */
export function StoryThumbList({ posts }: StoryThumbListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openPost = openIndex === null ? null : posts[openIndex];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b-2 border-ink pb-3">
        <h2 className="font-serif text-2xl font-bold text-ink">Top stories</h2>
        <span className="text-xs text-muted">Tap a story to preview</span>
      </div>

      <ol className="flex flex-col divide-y divide-border">
        {posts.map((post, index) => (
          <li key={post.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setOpenIndex(index)}
              className={clsx(
                "group flex w-full items-center gap-4 rounded-lg py-3 text-left hover:bg-surface motion-safe:transition-colors",
                focusRing,
              )}
            >
              <span className="relative w-28 shrink-0 overflow-hidden rounded-md sm:w-32">
                <CoverImage
                  src={post.coverImageUrl}
                  alt=""
                  gradient={post.coverGradient}
                  sizes="128px"
                  priority={index === 0}
                  className="aspect-[4/3]"
                  imageClassName="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-110"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center bg-ink/0 text-paper opacity-0 group-hover:bg-ink/40 group-hover:opacity-100 motion-safe:transition"
                >
                  <Expand className="size-5" />
                </span>
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-paper font-serif text-xs font-bold text-ink"
                >
                  {index + 1}
                </span>
              </span>
              <span className="flex min-w-0 flex-col gap-1.5">
                {post.category ? <span className={clsx(kicker, "text-[10px]")}>{post.category.name}</span> : null}
                <span className="line-clamp-2 font-serif text-base leading-snug font-semibold text-ink group-hover:text-primary sm:text-lg">
                  {post.title}
                </span>
                {post.publishedAt ? (
                  <time dateTime={post.publishedAt} className="text-xs text-muted">
                    {formatDayTime(post.publishedAt)}
                  </time>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {openPost && openIndex !== null ? (
        <StoryPreviewDialog
          post={openPost}
          position={`${openIndex + 1} of ${posts.length}`}
          onPrevious={openIndex > 0 ? () => setOpenIndex(openIndex - 1) : null}
          onNext={openIndex < posts.length - 1 ? () => setOpenIndex(openIndex + 1) : null}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </div>
  );
}
