import { clsx } from "clsx";
import Link from "next/link";
import { CoverImage } from "@/components/ui/cover-image";
import type { PostSummary } from "@/lib/types";
import { focusRing, kicker } from "@/lib/ui";

type TrendingListProps = {
  posts: PostSummary[];
};

/** The homepage "Top stories" row: up to four numbered stories, 01 to 04, with cover photos. */
export function TrendingList({ posts }: TrendingListProps) {
  return (
    <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {posts.slice(0, 4).map((post, index) => (
        <li key={post.id} className="group relative flex flex-col gap-4">
          <CoverImage
            src={post.coverImageUrl}
            alt=""
            gradient={post.coverGradient}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
            className="aspect-[16/10] rounded-lg"
            imageClassName="motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
          />
          <div className="flex gap-4">
            <span aria-hidden="true" className="font-serif text-5xl leading-none font-bold text-primary/25">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-col gap-2">
              {post.category ? <p className={kicker}>{post.category.name}</p> : null}
              <h3 className="font-serif text-xl leading-snug font-semibold text-ink group-hover:text-primary">
                <Link
                  href={`/post/${post.slug}`}
                  className={clsx("rounded-sm after:absolute after:inset-0 after:content-['']", focusRing)}
                >
                  {post.title}
                </Link>
              </h3>
              <p className="text-sm text-muted">{post.readMinutes} min read</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
