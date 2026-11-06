"use client";

import { clsx } from "clsx";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CoverImage } from "@/components/ui/cover-image";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { avatarPhotoFor } from "@/lib/avatars";
import { formatDayTime } from "@/lib/format";
import type { AuthorProfile, PostSummary } from "@/lib/types";
import { focusRing, kicker, textLink } from "@/lib/ui";

type AdminSliderProps = {
  admins: AuthorProfile[];
  /** Recent published stories keyed by admin id, shown as small cards under each slide. */
  postsByAdmin: Record<string, PostSummary[]>;
};

const arrowButton = clsx(
  "flex size-11 items-center justify-center rounded-full border border-border bg-paper text-ink hover:border-primary hover:text-primary motion-safe:transition-colors",
  focusRing,
);

/**
 * Homepage admins carousel: one admin card at a time inside a panel, with previous/next
 * arrows and an avatar strip to jump straight to an admin. Wraps around at both ends.
 * Each slide lists a few of that admin's recent stories as small cards.
 */
export function AdminSlider({ admins, postsByAdmin }: AdminSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (admins.length === 0) return null;
  const count = admins.length;
  const go = (index: number) => setActiveIndex((index + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby="admin-slider-heading"
      className="flex h-full flex-col gap-6 rounded-xl border border-border bg-surface p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 border-b-2 border-ink pb-3">
        <div className="flex flex-col gap-1">
          <p className={kicker}>Our team</p>
          <h2 id="admin-slider-heading" className="font-serif text-2xl font-bold text-ink">
            Meet the admins
          </h2>
        </div>
        {count > 1 ? (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous admin" onClick={() => go(activeIndex - 1)} className={arrowButton}>
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button type="button" aria-label="Next admin" onClick={() => go(activeIndex + 1)} className={arrowButton}>
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-hidden" aria-live="polite">
        <ul
          className="flex h-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {admins.map((admin, index) => {
            const current = index === activeIndex;
            const posts = postsByAdmin[admin.id] ?? [];
            return (
              <li
                key={admin.id}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                inert={!current}
                className="flex w-full shrink-0 flex-col gap-4"
              >
                <article className="flex flex-col gap-6 rounded-lg border border-border bg-paper p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-10">
                  <PersonAvatar
                    name={admin.displayName}
                    gradient={admin.avatarGradient}
                    photoUrl={avatarPhotoFor(admin.username)}
                    sizes="160px"
                    className="size-28 ring-4 ring-paper shadow-md sm:size-40"
                  />
                  <div className="flex flex-col gap-3">
                    <h3 className="font-serif text-3xl leading-tight font-bold text-ink sm:text-4xl">
                      {admin.displayName}
                    </h3>
                    <p className="text-sm font-semibold text-primary">
                      {admin.status === "ACTIVE" ? "Admin" : "Admin · Profile pending"}
                    </p>
                    {admin.bio ? (
                      <p className="line-clamp-4 max-w-xl text-base leading-7 text-muted">{admin.bio}</p>
                    ) : null}
                    <Link
                      href={`/authors/${admin.username}`}
                      className={clsx(textLink, "inline-flex w-fit items-center gap-1 text-sm")}
                    >
                      View stories
                      <ArrowRight aria-hidden="true" className="size-4" />
                      <span className="sr-only"> by {admin.displayName}</span>
                    </Link>
                  </div>
                </article>
                {posts.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-ink">Recent stories by {admin.displayName}</h4>
                    <ul className="grid gap-3 sm:grid-cols-3">
                      {posts.map((post) => (
                        <li key={post.id}>
                          <Link
                            href={`/post/${post.slug}`}
                            className={clsx(
                              "group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-paper hover:border-primary motion-safe:transition-colors",
                              focusRing,
                            )}
                          >
                            <CoverImage
                              src={post.coverImageUrl}
                              alt=""
                              gradient={post.coverGradient}
                              sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 100vw"
                              className="aspect-video"
                              imageClassName="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                            />
                            <span className="flex flex-col gap-1.5 p-3">
                              {post.category ? (
                                <span className={clsx(kicker, "text-[10px]")}>{post.category.name}</span>
                              ) : null}
                              <span className="line-clamp-2 font-serif text-sm leading-snug font-semibold text-ink group-hover:text-primary">
                                {post.title}
                              </span>
                              {post.publishedAt ? (
                                <time dateTime={post.publishedAt} className="text-xs text-muted">
                                  {formatDayTime(post.publishedAt)}
                                </time>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {count > 1 ? (
          <ul aria-label="Choose an admin" className="flex flex-wrap gap-2">
            {admins.map((admin, index) => (
              <li key={admin.id}>
                <button
                  type="button"
                  aria-label={`Show ${admin.displayName}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => go(index)}
                  className={clsx(
                    "flex rounded-full ring-offset-2 ring-offset-surface motion-safe:transition",
                    index === activeIndex ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100",
                    focusRing,
                  )}
                >
                  <span aria-hidden="true">
                    <PersonAvatar
                      name={admin.displayName}
                      gradient={admin.avatarGradient}
                      photoUrl={avatarPhotoFor(admin.username)}
                      sizes="40px"
                      className="size-10"
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <Link href="/admins" className={clsx(textLink, "text-sm")}>
          View all admins
        </Link>
      </div>
    </section>
  );
}
