"use client";

import { clsx } from "clsx";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { focusRing } from "@/lib/ui";

type VideoPlayerDialogProps = {
  videoId: string;
  title: string;
  storyHref: string;
  onClose: () => void;
};

/**
 * Modal YouTube player. It is mounted only after the reader presses play, so nothing is
 * requested from youtube-nocookie.com before then. The native <dialog> traps focus, closes
 * on Escape, and returns focus to the play button when it closes.
 */
export function VideoPlayerDialog({ videoId, title, storyHref, onClose }: VideoPlayerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    // Guarded so React's development double-invoke does not open it twice.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto w-[min(960px,calc(100vw-2rem))] max-w-none overflow-hidden rounded-xl bg-ink p-0 text-paper shadow-2xl backdrop:bg-ink/80 motion-safe:animate-fade-up"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <p className="truncate text-sm font-semibold">{title}</p>
        <button
          type="button"
          autoFocus
          aria-label="Close video"
          onClick={() => dialogRef.current?.close()}
          className={clsx(
            "flex size-11 shrink-0 items-center justify-center rounded-md text-paper hover:bg-paper/10",
            focusRing,
          )}
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="relative aspect-video w-full bg-ink">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
      <div className="flex justify-end px-4 py-3 sm:px-5">
        <Link
          href={storyHref}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-paper underline-offset-4 hover:underline",
            focusRing,
          )}
        >
          Read the full story
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </dialog>
  );
}
