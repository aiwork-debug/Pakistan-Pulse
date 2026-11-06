import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import { formatDayTime } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import { focusRing, kicker } from "@/lib/ui";

type FrontPageHeroProps = {
  /** Slot 1: the main story. */
  lead: PostSummary;
  /** Slots 2-5: the numbered top stories under the main story. */
  side: PostSummary[];
};

const stretchedLink = clsx("rounded-sm after:absolute after:inset-0 after:content-['']", focusRing);

function categoryLabel(post: PostSummary): string | null {
  if (!post.category) return null;
  return post.category.parent ? `${post.category.parent.name} · ${post.category.name}` : post.category.name;
}

/**
 * Homepage front page: a full-width photo with the main headline set over it, then a
 * roomy row of four numbered top stories.
 */
export function FrontPageHero({ lead, side }: FrontPageHeroProps) {
  const leadLabel = categoryLabel(lead);

  return (
    <div className="flex flex-col gap-10 lg:gap-14">
      {/* Main story */}
      <article className="group relative isolate flex min-h-[480px] flex-col justify-end overflow-hidden rounded-2xl sm:min-h-[540px] lg:min-h-[620px]">
        <CoverImage
          src={lead.coverImageUrl}
          alt={lead.coverAlt}
          gradient={lead.coverGradient}
          sizes="(min-width: 1280px) 1216px, 100vw"
          priority
          className="absolute! inset-0 -z-10 h-full"
          imageClassName="motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.02]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/60 to-ink/0"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-ink/60 to-transparent" />

        <div className="flex max-w-3xl flex-col gap-5 p-6 sm:p-10 lg:p-14">
          <p className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.18em] text-paper uppercase">
            <span className="rounded-full bg-paper px-3 py-1 text-ink">Top story</span>
            {leadLabel ? <span>{leadLabel}</span> : null}
          </p>
          <h2 className="font-serif text-4xl leading-[1.08] font-bold text-balance text-paper sm:text-5xl lg:text-6xl">
            <Link
              href={`/post/${lead.slug}`}
              className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
            >
              {lead.title}
            </Link>
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-paper/85">{lead.dek}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-paper/80">
              {lead.author ? (
                <Link
                  href={`/authors/${lead.author.username}`}
                  className="relative z-10 rounded-sm font-semibold text-paper hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
                >
                  {lead.author.displayName}
                </Link>
              ) : null}
              {lead.author && lead.publishedAt ? <span aria-hidden="true">·</span> : null}
              {lead.publishedAt ? <time dateTime={lead.publishedAt}>{formatDayTime(lead.publishedAt)}</time> : null}
              <span aria-hidden="true">·</span>
              <span>{lead.readMinutes} min read</span>
            </p>
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-2 text-sm font-semibold text-paper motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
            >
              Read the story
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </article>

      {/* Numbered top stories */}
      {side.length > 0 ? (
        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {side.slice(0, 4).map((post, index) => {
            const label = categoryLabel(post);
            return (
              <li key={post.id} className="group relative flex flex-col gap-4 border-t-2 border-ink pt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span aria-hidden="true" className="font-serif text-3xl leading-none font-bold text-primary">
                    {String(index + 2).padStart(2, "0")}
                  </span>
                  {post.publishedAt ? (
                    <time dateTime={post.publishedAt} className="text-xs text-muted">
                      {formatDayTime(post.publishedAt)}
                    </time>
                  ) : null}
                </div>
                <div className="overflow-hidden rounded-lg">
                  <CoverImage
                    src={post.coverImageUrl}
                    alt={post.coverAlt}
                    gradient={post.coverGradient}
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[3/2]"
                    imageClassName="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                  />
                </div>
                {label ? <p className={kicker}>{label}</p> : null}
                <h3 className="font-serif text-xl leading-snug font-semibold text-ink group-hover:text-primary">
                  <Link href={`/post/${post.slug}`} className={stretchedLink}>
                    {post.title}
                  </Link>
                </h3>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
