"use client";

import { clsx } from "clsx";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { formatDayTime } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import { buttonPrimary, buttonSecondary, focusRing, kicker } from "@/lib/ui";

type StoryPreviewDialogProps = {
  post: PostSummary;
  /** Position label such as "2 of 5". */
  position: string;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  onClose: () => void;
};

const navButton = clsx(
  "flex size-11 items-center justify-center rounded-full border border-border bg-paper text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40",
  focusRing,
);

/**
 * Popup preview of a homepage story: the cover large, the headline, summary, and byline,
 * with arrows to step through the other stories. The native <dialog> traps focus, closes on
 * Escape, and returns focus to the thumbnail that opened it.
 */
export function StoryPreviewDialog({ post, position, onPrevious, onNext, onClose }: StoryPreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const href = `/post/${post.slug}`;
  const category = post.category
    ? post.category.parent
      ? `${post.category.parent.name} · ${post.category.name}`
      : post.category.name
    : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    // Guarded so React's development double-invoke does not open it twice.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="story-preview-title"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" && onPrevious) onPrevious();
        if (event.key === "ArrowRight" && onNext) onNext();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(880px,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/80 motion-safe:animate-fade-up"
    >
      <div className="relative">
        <CoverImage
          key={post.id}
          src={post.coverImageUrl}
          alt={post.coverAlt}
          gradient={post.coverGradient}
          sizes="(min-width: 920px) 880px, 100vw"
          className="aspect-video"
        />
        <button
          type="button"
          autoFocus
          aria-label="Close preview"
          onClick={() => dialogRef.current?.close()}
          className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-ink/70 text-paper hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        <span className="absolute bottom-3 left-3 rounded bg-ink/70 px-2 py-0.5 text-xs font-semibold text-paper">
          {position}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-6 sm:p-8">
        {category ? <p className={kicker}>{category}</p> : null}
        <h2
          id="story-preview-title"
          className="font-serif text-3xl leading-[1.15] font-bold text-balance text-ink sm:text-4xl"
        >
          {post.title}
        </h2>
        <p className="text-lg leading-8 text-muted">{post.dek}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          {post.author ? (
            <Link
              href={`/authors/${post.author.username}`}
              className={clsx("rounded-sm font-semibold text-ink hover:text-primary", focusRing)}
            >
              {post.author.displayName}
            </Link>
          ) : null}
          {post.author && post.publishedAt ? <span aria-hidden="true">·</span> : null}
          {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDayTime(post.publishedAt)}</time> : null}
          <span aria-hidden="true">·</span>
          <span>{post.readMinutes} min read</span>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous story"
              disabled={!onPrevious}
              onClick={() => onPrevious?.()}
              className={navButton}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next story"
              disabled={!onNext}
              onClick={() => onNext?.()}
              className={navButton}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => dialogRef.current?.close()} className={buttonSecondary}>
              Close
            </button>
            <Link href={href} className={buttonPrimary}>
              Read full story
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
