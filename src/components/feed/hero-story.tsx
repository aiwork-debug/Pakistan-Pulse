import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import { formatLongDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import { buttonPrimary, focusRing, kicker } from "@/lib/ui";

type HeroStoryProps = {
  post: PostSummary;
};

export function HeroStory({ post }: HeroStoryProps) {
  const href = `/post/${post.slug}`;

  return (
    <article className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="group block overflow-hidden rounded-xl lg:col-span-7"
      >
        <CoverImage
          src={post.coverImageUrl}
          alt=""
          gradient={post.coverGradient}
          sizes="(min-width: 1280px) 700px, (min-width: 1024px) 58vw, 100vw"
          priority
          className="aspect-[4/3] sm:aspect-video"
          imageClassName="motion-safe:transition-transform motion-safe:duration-[400ms] motion-safe:group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-col gap-5 lg:col-span-5">
        <p className={kicker}>Top story{post.category ? ` · ${post.category.name}` : ""}</p>
        <h2 className="font-serif text-5xl leading-[1.08] font-bold text-ink lg:text-6xl">
          <Link href={href} className={clsx("rounded-sm hover:text-primary", focusRing)}>
            {post.title}
          </Link>
        </h2>
        <p className="text-lg leading-8 text-muted">{post.dek}</p>
        <p className="text-sm text-muted">
          {post.author ? (
            <>
              By{" "}
              <Link
                href={`/authors/${post.author.username}`}
                className={clsx("rounded-sm font-semibold text-ink hover:text-primary", focusRing)}
              >
                {post.author.displayName}
              </Link>
              {post.publishedAt ? " · " : null}
            </>
          ) : null}
          {post.publishedAt ? <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time> : null}
          {` · ${post.readMinutes} min read`}
        </p>
        <Link href={href} className={clsx(buttonPrimary, "w-fit")}>
          Read story
          <ArrowRight aria-hidden="true" className="size-4" />
          <span className="sr-only">: {post.title}</span>
        </Link>
      </div>
    </article>
  );
}
