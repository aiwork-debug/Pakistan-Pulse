import { clsx } from "clsx";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { avatarPhotoFor } from "@/lib/avatars";
import { gradientClass } from "@/lib/gradients";
import type { Topic } from "@/lib/categories";
import type { AuthorProfile } from "@/lib/types";

type ChannelHeaderProps = {
  author: Pick<AuthorProfile, "username" | "displayName" | "bio" | "avatarGradient">;
  role: string;
  /** Omitted for authors whose stories are unavailable. */
  stats?: { stories: number; videos: number };
  /** Sections this author writes in, most used first. */
  topics?: Topic[];
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

/** Channel-style author header: banner, large avatar, name, handle, counts, bio, and beats. */
export function ChannelHeader({ author, role, stats, topics = [] }: ChannelHeaderProps) {
  const gradient = gradientClass(author.avatarGradient);

  return (
    <header className="flex flex-col">
      <div
        aria-hidden="true"
        className={clsx("relative h-28 overflow-hidden rounded-xl bg-linear-to-br sm:h-40", gradient)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,var(--color-paper)_0,transparent_45%)] opacity-15" />
        <p className="absolute right-6 bottom-4 font-serif text-sm font-semibold tracking-[0.2em] text-paper/80 uppercase">
          Pulse newsroom
        </p>
      </div>

      <div className="flex flex-col gap-5 px-1 sm:flex-row sm:items-end sm:gap-6 sm:px-6">
        <PersonAvatar
          name={author.displayName}
          gradient={author.avatarGradient}
          photoUrl={avatarPhotoFor(author.username)}
          initials={initialsOf(author.displayName)}
          className="-mt-12 size-24 text-3xl ring-4 ring-paper sm:-mt-16 sm:size-32 sm:text-4xl"
          sizes="(min-width: 640px) 128px, 96px"
        />

        <div className="flex min-w-0 flex-col gap-2 sm:pb-1">
          <h1 className="font-serif text-4xl leading-tight font-bold text-ink sm:text-5xl">{author.displayName}</h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="font-semibold text-ink">@{author.username}</span>
            <span aria-hidden="true">·</span>
            <span>{role}</span>
            {stats ? (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {stats.stories} {stats.stories === 1 ? "story" : "stories"}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {stats.videos} {stats.videos === 1 ? "video" : "videos"}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-1 pt-5 sm:px-6">
        {author.bio ? <p className="max-w-3xl text-base leading-7 text-muted">{author.bio}</p> : null}
        {topics.length > 0 ? (
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">Covers </span>
            {topics.map((topic) => topic.name).join(", ")}
          </p>
        ) : null}
      </div>
    </header>
  );
}
