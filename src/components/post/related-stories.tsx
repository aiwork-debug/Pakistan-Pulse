import { StoryCard } from "@/components/feed/story-card";
import type { PostSummary } from "@/lib/types";

type RelatedStoriesProps = {
  posts: PostSummary[];
  categoryName?: string;
};

export function RelatedStories({ posts, categoryName }: RelatedStoriesProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="flex flex-col gap-8 border-t-2 border-primary pt-4">
      <h2 id="related-heading" className="font-serif text-3xl font-bold text-ink">
        {categoryName ? `More in ${categoryName}` : "Related stories"}
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {posts.map((post) => (
          <StoryCard key={post.id} post={post} variant="overlay" />
        ))}
      </div>
    </section>
  );
}
