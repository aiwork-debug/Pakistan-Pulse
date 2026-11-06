"use client";

import { clsx } from "clsx";
import { Play } from "lucide-react";
import { useState } from "react";
import { focusRing } from "@/lib/ui";

type YoutubeFacadeProps = {
  videoId: string;
  title: string;
};

/**
 * Click-to-load YouTube embed. Nothing is requested from YouTube until the reader presses
 * play, and the privacy-enhanced youtube-nocookie.com host is used.
 */
export function YoutubeFacade({ videoId, title }: YoutubeFacadeProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="my-4 flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0`}
            title={title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            aria-label={`Play video: ${title}`}
            onClick={() => setPlaying(true)}
            className={clsx(
              "group absolute inset-0 flex size-full items-center justify-center bg-linear-to-br from-ink via-ink to-primary",
              focusRing,
            )}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-paper/90 text-ink shadow-lg motion-safe:transition-transform motion-safe:group-hover:scale-110">
              <Play aria-hidden="true" className="ml-1 size-7" fill="currentColor" />
            </span>
            <span className="absolute bottom-4 left-4 rounded bg-ink/70 px-2 py-1 text-xs font-semibold tracking-wider text-paper uppercase">
              YouTube
            </span>
          </button>
        )}
      </div>
      {title ? <figcaption className="text-sm leading-6 text-muted">{title}</figcaption> : null}
    </figure>
  );
}
