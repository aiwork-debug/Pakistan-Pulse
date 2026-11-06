"use client";

import { clsx } from "clsx";
import { Calendar, Check, Clock, Play, Plus, Star, Tag, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { VideoPlayerDialog } from "@/components/feed/video-player-dialog";
import { CoverImage } from "@/components/ui/cover-image";
import { formatShortDate } from "@/lib/format";
import type { VideoItem } from "@/lib/types";
import { focusRing } from "@/lib/ui";

type VideoCardProps = {
  video: VideoItem;
  headingLevel?: "h2" | "h3";
};

/** How long the pointer rests on a card before the muted YouTube preview starts. */
const PREVIEW_DELAY_MS = 700;

/*
 * Hover preview. On devices with a fine pointer, hovering (or tabbing into) the card opens a
 * larger white panel over it: a muted preview, Watch / save / favourite actions, the summary,
 * and a details row. Touch devices skip the panel and keep the plain card with its play button.
 */
const panelShown =
  "pointer-fine:group-hover:pointer-events-auto pointer-fine:group-focus-within:pointer-events-auto pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 motion-safe:pointer-fine:group-hover:scale-100 motion-safe:pointer-fine:group-focus-within:scale-100 pointer-fine:group-hover:delay-300";

const circleButton = clsx(
  "flex size-10 items-center justify-center rounded-full border-2 border-ink text-ink hover:border-primary hover:text-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-paper motion-safe:transition-colors",
  focusRing,
);

function yearOf(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

export function VideoCard({ video, headingLevel = "h3" }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [muted, setMuted] = useState(true);
  // Watch-later and favourite are local to this page view; nothing is saved yet.
  const [saved, setSaved] = useState(false);
  const [starred, setStarred] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Heading = headingLevel;
  const { post, videoId } = video;
  const storyHref = `/post/${post.slug}`;
  // Stories without a cover photo fall back to the YouTube thumbnail, then the gradient.
  const posterSrc = post.coverImageUrl ?? (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function startPreview() {
    if (!videoId || playing) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS);
  }

  function stopPreview() {
    if (timer.current) clearTimeout(timer.current);
    setPreviewing(false);
    setMuted(true);
  }

  function watch() {
    stopPreview();
    setPlaying(true);
  }

  return (
    <article className="group relative" onMouseEnter={startPreview} onMouseLeave={stopPreview}>
      {/* Card: poster with the title set over it. */}
      <div className="relative overflow-hidden rounded-md bg-ink">
        <CoverImage
          src={posterSrc}
          alt={post.coverAlt}
          gradient={post.coverGradient}
          sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
          className="aspect-video"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/80 via-ink/10 to-transparent"
        />
        {videoId ? (
          <button
            type="button"
            aria-label={`Play video: ${video.title}`}
            onClick={watch}
            className={clsx("absolute inset-0 flex items-center justify-center", focusRing)}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-paper/90 text-ink shadow-lg pointer-fine:opacity-0">
              <Play aria-hidden="true" className="ml-0.5 size-5" fill="currentColor" />
            </span>
          </button>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
          <Heading className="line-clamp-2 text-xl leading-tight font-bold tracking-tight text-paper uppercase sm:text-2xl">
            <Link href={storyHref} className={clsx("pointer-events-auto rounded-sm", focusRing)}>
              {video.title}
            </Link>
          </Heading>
          <p className="text-xs text-paper/85 uppercase">
            {post.author ? <span className="font-bold text-paper">{post.author.displayName}</span> : null}
            {post.category ? ` ${post.category.name}` : null}
            {post.publishedAt ? (
              <>
                {" "}
                <time dateTime={post.publishedAt}>{yearOf(post.publishedAt)}</time>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Hover panel, opened over the card on hover or keyboard focus. */}
      <div
        className={clsx(
          "pointer-events-none absolute top-[-1.5rem] left-1/2 z-30 hidden w-[114%] -translate-x-1/2 overflow-hidden rounded-md bg-paper opacity-0 shadow-2xl ring-1 ring-border pointer-fine:block motion-safe:scale-95 motion-safe:transition motion-safe:duration-200 motion-safe:ease-out",
          panelShown,
        )}
      >
        <div className="relative aspect-video bg-ink">
          {previewing && videoId ? (
            <iframe
              key={muted ? "muted" : "sound"}
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&playsinline=1&rel=0&loop=1&playlist=${encodeURIComponent(videoId)}`}
              title={`Preview: ${video.title}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full border-0"
            />
          ) : (
            <CoverImage
              src={posterSrc}
              alt=""
              gradient={post.coverGradient}
              sizes="(min-width: 1024px) 480px, 60vw"
              className="absolute! inset-0 h-full"
            />
          )}
          {videoId ? (
            <button
              type="button"
              aria-label={muted ? "Unmute preview" : "Mute preview"}
              aria-pressed={!muted}
              onClick={() => {
                setMuted((value) => !value);
                setPreviewing(true);
              }}
              className={clsx(
                "absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-ink/40 text-paper hover:bg-ink/70 motion-safe:transition-colors",
                focusRing,
              )}
            >
              {muted ? (
                <VolumeX aria-hidden="true" className="size-4" />
              ) : (
                <Volume2 aria-hidden="true" className="size-4" />
              )}
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-3">
            {videoId ? (
              <button
                type="button"
                onClick={watch}
                className={clsx(
                  "inline-flex h-11 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-bold tracking-wide text-paper uppercase hover:bg-primary-hover motion-safe:transition-colors",
                  focusRing,
                )}
              >
                <Play aria-hidden="true" className="size-4" fill="currentColor" />
                Watch
              </button>
            ) : (
              <Link
                href={storyHref}
                className={clsx(
                  "inline-flex h-11 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-bold tracking-wide text-paper uppercase hover:bg-primary-hover motion-safe:transition-colors",
                  focusRing,
                )}
              >
                <Play aria-hidden="true" className="size-4" fill="currentColor" />
                Watch
              </Link>
            )}
            <button
              type="button"
              aria-label={saved ? "Remove from watch later" : "Add to watch later"}
              aria-pressed={saved}
              onClick={() => setSaved((value) => !value)}
              className={circleButton}
            >
              {saved ? (
                <Check aria-hidden="true" className="size-5" />
              ) : (
                <Plus aria-hidden="true" className="size-5" />
              )}
            </button>
            <button
              type="button"
              aria-label={starred ? "Remove from favourites" : "Add to favourites"}
              aria-pressed={starred}
              onClick={() => setStarred((value) => !value)}
              className={circleButton}
            >
              <Star aria-hidden="true" className="size-4" fill={starred ? "currentColor" : "none"} />
            </button>
          </div>

          <p className="line-clamp-4 text-base leading-6 text-ink/80">{post.dek}</p>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <li>
              <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-bold text-paper uppercase">
                {video.kind === "youtube" ? "YT" : "HD"}
              </span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4" />
              {post.readMinutes} min
            </li>
            {post.category ? (
              <li className="inline-flex items-center gap-1.5">
                <Tag aria-hidden="true" className="size-4" />
                {post.category.name}
              </li>
            ) : null}
            {post.publishedAt ? (
              <li className="inline-flex items-center gap-1.5">
                <Calendar aria-hidden="true" className="size-4" />
                <time dateTime={post.publishedAt}>{formatShortDate(post.publishedAt)}</time>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      {playing && videoId ? (
        <VideoPlayerDialog
          videoId={videoId}
          title={video.title}
          storyHref={storyHref}
          onClose={() => setPlaying(false)}
        />
      ) : null}
    </article>
  );
}
