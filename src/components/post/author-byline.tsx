import { clsx } from "clsx";
import Link from "next/link";
import { formatLongDate } from "@/lib/format";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { avatarPhotoFor } from "@/lib/avatars";
import type { PostSummary } from "@/lib/types";
import { focusRing } from "@/lib/ui";

type AuthorBylineProps = {
  author: NonNullable<PostSummary["author"]>;
  publishedAt: string | null;
  updatedAt: string;
  readMinutes: number;
};

export function AuthorByline({ author, publishedAt, updatedAt, readMinutes }: AuthorBylineProps) {
  const initials = author.displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  // Only show "Updated" when the story changed on a later day than it was published.
  const showUpdated =
    publishedAt !== null && formatLongDate(updatedAt) !== formatLongDate(publishedAt);

  return (
    <div className="flex flex-col gap-6 border-y border-border py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <PersonAvatar
          name={author.displayName}
          gradient={author.avatarGradient}
          photoUrl={avatarPhotoFor(author.username)}
          initials={initials}
          className="size-12 text-lg"
          sizes="48px"
        />
        <div className="flex flex-col">
          <Link
            href={`/authors/${author.username}`}
            className={clsx("rounded-sm font-semibold text-ink hover:text-primary", focusRing)}
          >
            {author.displayName}
          </Link>
          <span className="text-sm text-muted">Pulse newsroom</span>
        </div>
      </div>
      <div className="flex flex-col text-sm text-muted sm:items-end">
        {publishedAt ? (
          <span>
            Published <time dateTime={publishedAt}>{formatLongDate(publishedAt)}</time>
          </span>
        ) : null}
        {showUpdated ? (
          <span>
            Updated <time dateTime={updatedAt}>{formatLongDate(updatedAt)}</time>
          </span>
        ) : null}
        <span>{readMinutes} min read</span>
      </div>
    </div>
  );
}
