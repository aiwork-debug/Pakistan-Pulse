import { clsx } from "clsx";
import Link from "next/link";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { avatarPhotoFor } from "@/lib/avatars";
import type { AuthorProfile } from "@/lib/types";
import { textLink } from "@/lib/ui";

type AuthorCardProps = {
  author: Pick<AuthorProfile, "username" | "displayName" | "bio" | "avatarGradient">;
  variant?: "full" | "compact";
  publishedCount?: number;
  headingLevel?: "h1" | "h2" | "h3";
  className?: string;
  role?: string;
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ author, size }: { author: AuthorCardProps["author"]; size: "lg" | "md" }) {
  return (
    <PersonAvatar
      name={author.displayName}
      gradient={author.avatarGradient}
      photoUrl={avatarPhotoFor(author.username)}
      initials={initialsOf(author.displayName)}
      className={size === "lg" ? "size-24 text-3xl" : "size-16 text-xl"}
      sizes={size === "lg" ? "96px" : "64px"}
    />
  );
}

export function AuthorCard({
  author,
  variant = "compact",
  publishedCount,
  headingLevel,
  className,
  role = "Pulse newsroom",
}: AuthorCardProps) {
  if (variant === "full") {
    const Heading = headingLevel ?? "h1";
    return (
      <section
        className={clsx(
          "flex flex-col gap-6 rounded-xl border border-border bg-surface p-8 sm:flex-row sm:items-start",
          className,
        )}
      >
        <Avatar author={author} size="lg" />
        <div className="flex flex-col gap-3">
          <Heading className="font-serif text-4xl leading-tight font-bold text-ink">{author.displayName}</Heading>
          <p className="text-base font-semibold text-primary">{role}</p>
          {author.bio ? <p className="max-w-2xl text-base leading-7 text-muted">{author.bio}</p> : null}
          {publishedCount !== undefined ? (
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{publishedCount}</span> published{" "}
              {publishedCount === 1 ? "story" : "stories"}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  const Heading = headingLevel ?? "h3";
  return (
    <div className={clsx("flex flex-col gap-5 rounded-xl border border-border bg-paper p-6", className)}>
      <div className="flex items-center gap-4">
        <Avatar author={author} size="md" />
        <div className="flex flex-col gap-1">
          <Heading className="font-serif text-xl font-semibold text-ink">{author.displayName}</Heading>
          <p className="text-sm font-semibold text-primary">{role}</p>
        </div>
      </div>
      {author.bio ? <p className="line-clamp-4 text-base leading-7 text-muted">{author.bio}</p> : null}
      <Link href={`/authors/${author.username}`} className={clsx(textLink, "w-fit text-sm")}>
        View stories<span className="sr-only"> by {author.displayName}</span>
      </Link>
    </div>
  );
}
