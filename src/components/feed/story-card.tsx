import { clsx } from "clsx";
import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import { formatShortDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import { focusRing, kicker } from "@/lib/ui";

type StoryCardProps = {
  post: PostSummary;
  variant?: "standard" | "compact" | "overlay" | "horizontal";
  headingLevel?: "h2" | "h3";
  className?: string;
};

/** The title link stretches over the whole card, so the card has a single link. */
const stretchedLink = clsx("rounded-sm after:absolute after:inset-0 after:content-['']", focusRing);

const coverZoom =
  "motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]";

function Byline({ post, light = false }: { post: PostSummary; light?: boolean }) {
  return (
    <p className={clsx("text-sm", light ? "text-paper/85" : "text-muted")}>
      {post.author ? (
        <Link
          href={`/authors/${post.author.username}`}
          className={clsx(
            "relative z-10 rounded-sm font-medium",
            light ? "text-paper hover:underline" : "text-ink hover:text-primary",
            focusRing,
          )}
        >
          {post.author.displayName}
        </Link>
      ) : null}
      {post.author && post.publishedAt ? " · " : null}
      {post.publishedAt ? <time dateTime={post.publishedAt}>{formatShortDate(post.publishedAt)}</time> : null}
    </p>
  );
}

function Cover({ post, className, sizes }: { post: PostSummary; className: string; sizes: string }) {
  return (
    <CoverImage
      src={post.coverImageUrl}
      alt={post.coverAlt}
      gradient={post.coverGradient}
      sizes={sizes}
      className={className}
      imageClassName={coverZoom}
    />
  );
}

export function StoryCard({ post, variant = "standard", headingLevel = "h3", className }: StoryCardProps) {
  const Heading = headingLevel;
  const href = `/post/${post.slug}`;

  if (variant === "compact") {
    return (
      <article className={clsx("group relative flex items-start gap-4", className)}>
        <div className="w-20 shrink-0 overflow-hidden rounded-md sm:w-24">
          <Cover post={post} className="aspect-square" sizes="96px" />
        </div>
        <div className="flex flex-col gap-1.5">
          {post.category ? <p className={kicker}>{post.category.name}</p> : null}
          <Heading className="font-serif text-lg leading-snug font-semibold text-ink group-hover:text-primary">
            <Link href={href} className={stretchedLink}>
              {post.title}
            </Link>
          </Heading>
          {post.publishedAt ? (
            <p className="text-sm text-muted">
              <time dateTime={post.publishedAt}>{formatShortDate(post.publishedAt)}</time>
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  if (variant === "overlay") {
    return (
      <article className={clsx("group relative isolate overflow-hidden rounded-lg", className)}>
        <Cover post={post} className="aspect-[4/5]" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
          {post.category ? (
            <p className="text-xs font-semibold tracking-[0.18em] text-paper uppercase">{post.category.name}</p>
          ) : null}
          <Heading className="font-serif text-xl leading-snug font-semibold text-paper">
            <Link href={href} className={stretchedLink}>
              {post.title}
            </Link>
          </Heading>
          <Byline post={post} light />
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article
        className={clsx(
          "group relative grid gap-6 overflow-hidden rounded-xl border border-border bg-paper sm:grid-cols-2",
          className,
        )}
      >
        <div className="overflow-hidden">
          <Cover post={post} className="aspect-[4/3] h-full" sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw" />
        </div>
        <div className="flex flex-col justify-center gap-3 p-6 sm:pl-0">
          {post.category ? <p className={kicker}>{post.category.name}</p> : null}
          <Heading className="font-serif text-2xl leading-snug font-semibold text-ink group-hover:text-primary">
            <Link href={href} className={stretchedLink}>
              {post.title}
            </Link>
          </Heading>
          <p className="line-clamp-3 text-base leading-7 text-muted">{post.dek}</p>
          <Byline post={post} />
        </div>
      </article>
    );
  }

  return (
    <article className={clsx("group relative flex flex-col gap-4", className)}>
      <div className="overflow-hidden rounded-lg">
        <Cover post={post} className="aspect-[4/3]" sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
      </div>
      <div className="flex flex-col gap-2.5">
        {post.category ? <p className={kicker}>{post.category.name}</p> : null}
        <Heading className="font-serif text-xl leading-snug font-semibold text-ink motion-safe:transition-colors group-hover:text-primary">
          <Link href={href} className={stretchedLink}>
            {post.title}
          </Link>
        </Heading>
        <p className="line-clamp-2 text-base leading-7 text-muted">{post.dek}</p>
        <Byline post={post} />
      </div>
    </article>
  );
}
