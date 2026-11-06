import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { StoryCard } from "@/components/feed/story-card";
import { CoverImage } from "@/components/ui/cover-image";
import { formatDayTime } from "@/lib/format";
import type { CategoryNode, PostSummary } from "@/lib/types";
import { focusRing, kicker, textLink } from "@/lib/ui";

type DeskSectionProps = {
  section: CategoryNode;
  /** Newest first. The first story leads; up to four more are listed beside it. */
  posts: PostSummary[];
};

/** A homepage desk for one section: its subcategory links, a lead story, and a short list. */
export function DeskSection({ section, posts }: DeskSectionProps) {
  const [lead, ...others] = posts;
  if (!lead) return null;
  const headingId = `desk-${section.slug}-heading`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-t-4 border-ink pt-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-8">
          <h2 id={headingId} className="font-serif text-4xl font-bold text-ink">
            {section.name}
          </h2>
          {section.children.length > 0 ? (
            <nav aria-label={`${section.name} subcategories`}>
              <ul className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-1 text-sm font-semibold whitespace-nowrap sm:mx-0 sm:px-0 lg:pb-1.5">
                {section.children.map((child) => (
                  <li key={child.id} className="shrink-0">
                    <Link
                      href={`/news?category=${child.slug}`}
                      className={clsx("rounded-sm text-muted hover:text-primary", focusRing)}
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
        <Link
          href={`/news?category=${section.slug}`}
          className={clsx(textLink, "inline-flex shrink-0 items-center gap-1 text-sm")}
        >
          More {section.name.toLowerCase()}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <article className="group relative flex flex-col gap-4 lg:col-span-7">
          <div className="overflow-hidden rounded-lg">
            <CoverImage
              src={lead.coverImageUrl}
              alt={lead.coverAlt}
              gradient={lead.coverGradient}
              sizes="(min-width: 1280px) 700px, (min-width: 1024px) 58vw, 100vw"
              className="aspect-[16/9]"
              imageClassName="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
            />
          </div>
          {lead.category ? <p className={kicker}>{lead.category.name}</p> : null}
          <h3 className="font-serif text-3xl leading-tight font-bold text-ink group-hover:text-primary">
            <Link
              href={`/post/${lead.slug}`}
              className={clsx("rounded-sm after:absolute after:inset-0 after:content-['']", focusRing)}
            >
              {lead.title}
            </Link>
          </h3>
          <p className="text-base leading-7 text-muted">{lead.dek}</p>
          <p className="text-sm text-muted">
            {lead.author ? <span className="font-semibold text-ink">{lead.author.displayName}</span> : null}
            {lead.author && lead.publishedAt ? " · " : null}
            {lead.publishedAt ? <time dateTime={lead.publishedAt}>{formatDayTime(lead.publishedAt)}</time> : null}
          </p>
        </article>

        {others.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border lg:col-span-5">
            {others.slice(0, 4).map((post) => (
              <li key={post.id} className="py-5 first:pt-0 last:pb-0">
                <StoryCard post={post} variant="compact" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
