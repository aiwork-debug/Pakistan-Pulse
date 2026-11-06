"use client";

import { clsx } from "clsx";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { formatDayTime } from "@/lib/format";
import type { VideoItem } from "@/lib/types";
import { focusRing, kicker } from "@/lib/ui";

type HeroVideoPlayerProps = {
  /** YouTube videos, featured one first. Each must have a videoId. */
  videos: VideoItem[];
};

/** The story's own news photo first; the YouTube thumbnail only when the story has none. */
function thumbnailFor(video: VideoItem): string | null {
  if (video.post.coverImageUrl) return video.post.coverImageUrl;
  return video.videoId ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : null;
}

/**
 * Homepage featured video: a large click-to-play YouTube embed with a short playlist under
 * it. The iframe (youtube-nocookie.com) is mounted only after the reader presses play.
 */
export function HeroVideoPlayer({ videos }: HeroVideoPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = videos[activeIndex];
  if (!active?.videoId) return null;
  const { post } = active;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink shadow-lg">
        {playing ? (
          <iframe
            key={active.id}
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(active.videoId)}?autoplay=1&playsinline=1&rel=0`}
            title={active.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            aria-label={`Play video: ${active.title}`}
            onClick={() => setPlaying(true)}
            className={clsx("group absolute inset-0 size-full", focusRing)}
          >
            <CoverImage
              key={active.id}
              src={thumbnailFor(active)}
              alt=""
              gradient={post.coverGradient}
              sizes="(min-width: 1280px) 800px, (min-width: 1024px) 66vw, 100vw"
              priority
              className="absolute! inset-0 h-full"
              imageClassName="motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/20 to-transparent" />
            <span className="absolute top-4 left-4 rounded bg-primary px-2 py-0.5 text-xs font-semibold tracking-wider text-paper uppercase">
              Watch
            </span>
            <span className="absolute top-1/2 left-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper/95 text-ink shadow-xl group-hover:bg-primary group-hover:text-paper motion-safe:transition motion-safe:duration-200 motion-safe:group-hover:scale-110">
              <Play aria-hidden="true" className="ml-1 size-8" fill="currentColor" />
            </span>
            <span className="absolute inset-x-0 bottom-0 p-5 text-left sm:p-6">
              <span className="line-clamp-2 font-serif text-xl leading-snug font-bold text-paper sm:text-2xl">
                {active.title}
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {post.category ? <p className={kicker}>Video · {post.category.name}</p> : <p className={kicker}>Video</p>}
        <h2 className="font-serif text-2xl leading-snug font-bold text-ink sm:text-3xl">
          <Link href={`/post/${post.slug}`} className={clsx("rounded-sm hover:text-primary", focusRing)}>
            {post.title}
          </Link>
        </h2>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          {post.author ? <span className="font-semibold text-ink">{post.author.displayName}</span> : null}
          {post.author && post.publishedAt ? <span aria-hidden="true">·</span> : null}
          {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDayTime(post.publishedAt)}</time> : null}
          <Link
            href={`/post/${post.slug}`}
            className={clsx(
              "ml-auto inline-flex items-center gap-1 rounded-sm font-semibold text-primary hover:underline",
              focusRing,
            )}
          >
            Read story
            <ArrowRight aria-hidden="true" className="size-4" />
            <span className="sr-only">: {post.title}</span>
          </Link>
        </p>
      </div>

      {videos.length > 1 ? (
        <ul aria-label="More videos" className="grid grid-cols-3 gap-3">
          {videos.map((video, index) => {
            const current = index === activeIndex;
            return (
              <li key={video.id} className={clsx(current && "hidden")}>
                <button
                  type="button"
                  aria-label={`Switch to video: ${video.title}`}
                  onClick={() => {
                    setActiveIndex(index);
                    setPlaying(true);
                  }}
                  className={clsx("group flex w-full flex-col gap-2 rounded-lg text-left", focusRing)}
                >
                  <span className="relative block overflow-hidden rounded-md">
                    <CoverImage
                      src={thumbnailFor(video)}
                      alt=""
                      gradient={video.post.coverGradient}
                      sizes="(min-width: 1024px) 260px, 33vw"
                      className="aspect-video"
                      imageClassName="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center bg-ink/20 group-hover:bg-ink/40 motion-safe:transition-colors"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-paper/90 text-ink">
                        <Play className="ml-0.5 size-4" fill="currentColor" />
                      </span>
                    </span>
                  </span>
                  <span className="line-clamp-2 text-sm leading-snug font-semibold text-ink group-hover:text-primary">
                    {video.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
