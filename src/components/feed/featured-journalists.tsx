import { clsx } from "clsx";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { avatarPhotoFor } from "@/lib/avatars";
import type { AuthorProfile } from "@/lib/types";
import { focusRing, kicker, textLink } from "@/lib/ui";

type FeaturedJournalistsProps = {
  /** Up to 5 journalists, in slot order: 1 = large feature, 2 = button on the feature, 3-5 = cards. */
  journalists: AuthorProfile[];
  /** Every journalist, shown as small round icons along the bottom. */
  allJournalists: AuthorProfile[];
};

function roleLabel(journalist: AuthorProfile): string {
  return journalist.status === "ACTIVE" ? "Journalist" : "Journalist · Profile pending";
}

/**
 * Homepage hero panel beside Top stories: five journalist links.
 * Slot 1 is a large feature, slot 2 a button in its bottom-right corner, slots 3-5 are
 * white cards underneath, and a strip of small icons links to every journalist.
 * Profile photos are only about 200px, so they are always shown as round avatars near
 * that size rather than stretched across a card, which would blur them.
 */
export function FeaturedJournalists({ journalists, allJournalists }: FeaturedJournalistsProps) {
  const [lead, second, ...others] = journalists.slice(0, 5);
  if (!lead) return null;

  return (
    <section
      aria-labelledby="featured-journalists-heading"
      className="flex h-full flex-col gap-5 rounded-xl border border-border bg-surface p-4 sm:p-6"
    >
      <h2 id="featured-journalists-heading" className="sr-only">
        Featured journalists
      </h2>

      {/* Link 1: large feature. The name link stretches over the whole panel; link 2 sits
          above it in the corner, so the two links are never nested. */}
      <article className="group relative isolate flex min-h-85 flex-col overflow-hidden rounded-lg bg-linear-to-br from-ink via-ink to-primary p-5 text-paper shadow-lg motion-safe:animate-fade-up sm:min-h-100 sm:p-6">
        {/* Decorative rings behind the portrait */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <span className="absolute size-72 rounded-full border border-paper/10 motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-110" />
          <span className="absolute size-104 rounded-full border border-paper/5 motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105" />
          <span className="absolute -top-24 -right-24 size-64 rounded-full bg-primary/40 blur-3xl" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <span className="rounded-md bg-paper/15 px-3 py-1.5 text-xs font-bold tracking-[0.12em] uppercase backdrop-blur">
            Featured journalist
          </span>
          <span className="text-xs font-semibold tracking-[0.12em] text-paper/70 uppercase">Our team</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <PersonAvatar
            name={lead.displayName}
            gradient={lead.avatarGradient}
            photoUrl={avatarPhotoFor(lead.username)}
            sizes="144px"
            className="size-28 shadow-2xl ring-4 ring-paper/90 motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105 sm:size-36"
          />
          <h3 className="mt-2 font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl">
            <Link
              href={`/authors/${lead.username}`}
              className={clsx(
                "rounded-sm after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4",
                focusRing,
              )}
            >
              {lead.displayName}
            </Link>
          </h3>
          <p className="text-sm font-semibold tracking-wide text-paper/80">{roleLabel(lead)}</p>
          {lead.bio ? <p className="line-clamp-2 max-w-xl text-sm leading-6 text-paper/70">{lead.bio}</p> : null}
        </div>

        {/* Link 2: top-right feature button */}
        {second ? (
          <div className="relative z-10 flex justify-end">
            <Link
              href={`/authors/${second.username}`}
              className={clsx(
                "group/btn inline-flex items-center gap-2 rounded-md bg-paper/15 px-4 py-2.5 text-sm font-semibold text-paper backdrop-blur hover:bg-paper hover:text-ink motion-safe:transition-colors",
                focusRing,
              )}
            >
              {second.displayName}
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 motion-safe:transition-transform motion-safe:group-hover/btn:translate-x-0.5 motion-safe:group-hover/btn:-translate-y-0.5"
              />
            </Link>
          </div>
        ) : null}
      </article>

      {/* Links 3-5: white journalist cards */}
      {others.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-3">
          {others.map((journalist, index) => (
            <li
              key={journalist.id}
              className="motion-safe:animate-fade-up"
              style={{ animationDelay: `${120 + index * 100}ms` }}
            >
              <Link
                href={`/authors/${journalist.username}`}
                className={clsx(
                  "group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-lg border border-border bg-paper px-4 pt-6 pb-5 text-center shadow-sm hover:border-primary hover:shadow-lg motion-safe:transition motion-safe:duration-300 motion-safe:hover:-translate-y-1",
                  focusRing,
                )}
              >
                {/* Teal accent bar that grows in on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-x-100"
                />
                <span aria-hidden="true">
                  <PersonAvatar
                    name={journalist.displayName}
                    gradient={journalist.avatarGradient}
                    photoUrl={avatarPhotoFor(journalist.username)}
                    sizes="96px"
                    className="size-20 shadow-md ring-4 ring-surface group-hover:ring-primary/20 motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-105 sm:size-24"
                  />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-serif text-base leading-snug font-bold text-ink group-hover:text-primary motion-safe:transition-colors">
                    {journalist.displayName}
                  </span>
                  <span className={clsx(kicker, "text-[10px]")}>{roleLabel(journalist)}</span>
                </span>
                {journalist.bio ? (
                  <span className="line-clamp-2 text-xs leading-5 text-muted">{journalist.bio}</span>
                ) : null}
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-muted group-hover:text-primary motion-safe:transition-colors">
                  View profile
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Small icons for every journalist */}
      {allJournalists.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <ul aria-label="All journalists" className="flex flex-wrap gap-2">
            {allJournalists.map((journalist) => (
              <li key={journalist.id}>
                <Link
                  href={`/authors/${journalist.username}`}
                  title={journalist.displayName}
                  aria-label={journalist.displayName}
                  className={clsx(
                    "flex rounded-full ring-2 ring-paper hover:ring-primary motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-110",
                    focusRing,
                  )}
                >
                  <span aria-hidden="true">
                    <PersonAvatar
                      name={journalist.displayName}
                      gradient={journalist.avatarGradient}
                      photoUrl={avatarPhotoFor(journalist.username)}
                      sizes="40px"
                      className="size-10"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/admins" className={clsx(textLink, "text-sm")}>
            View all journalists
          </Link>
        </div>
      ) : null}
    </section>
  );
}
