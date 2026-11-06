"use client";

import { clsx } from "clsx";
import { Play } from "lucide-react";
import { useState } from "react";
import { focusRing } from "@/lib/ui";

type VideoPlaceholderProps = {
  src: string;
  poster: string;
  title: string;
};

export function VideoPlaceholder({ src, poster, title }: VideoPlaceholderProps) {
  const [requested, setRequested] = useState(false);
  const label = title || "Video";

  return (
    <figure className="my-4 flex flex-col gap-3">
      {/*
        Vidstack player mount point. The player (with hls.js for HLS playback) attaches to
        this container and loads `data-video-src` once it is installed. Until then, and
        whenever no source exists, this placeholder is shown.
      */}
      <div
        data-video-src={src || undefined}
        className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl bg-linear-to-br from-ink via-ink to-primary"
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover opacity-60" />
        ) : null}
        <button
          type="button"
          aria-label={`Play video: ${label}`}
          onClick={() => setRequested(true)}
          className={clsx(
            "relative flex size-16 items-center justify-center rounded-full bg-paper/90 text-ink shadow-lg motion-safe:transition-transform motion-safe:hover:scale-110",
            focusRing,
          )}
        >
          <Play aria-hidden="true" className="ml-1 size-7" fill="currentColor" />
        </button>
        <p className="relative rounded bg-ink/70 px-3 py-1 text-sm font-medium text-paper">
          Video player loads here
        </p>
        <p role="status" className="relative text-sm text-paper">
          {requested ? (src ? "The video player is not connected yet." : "This video has no source yet.") : ""}
        </p>
      </div>
      {title ? <figcaption className="text-sm leading-6 text-muted">{title}</figcaption> : null}
    </figure>
  );
}
