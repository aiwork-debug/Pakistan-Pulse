import { Newspaper } from "lucide-react";
import { EmptyState } from "@/components/feed/empty-state";
import { SectionHeading } from "@/components/feed/section-heading";
import { StoryCard } from "@/components/feed/story-card";
import { VideoCard } from "@/components/feed/video-card";
import { postInCategory, type Topic } from "@/lib/categories";
import { channelHref } from "@/lib/channel";
import type { PostSummary, VideoItem } from "@/lib/types";

type ChannelHomeProps = {
  username: string;
  displayName: string;
  stories: PostSummary[];
  videos: VideoItem[];
  topics: Topic[];
};

/** The channel's Home tab: the newest story, a videos row, then a shelf per section. */
export function ChannelHome({ username, displayName, stories, videos, topics }: ChannelHomeProps) {
  const [newest] = stories;
  if (!newest) {
    return (
      <div className="pt-10">
        <EmptyState
          icon={Newspaper}
          headingLevel="h2"
          title="No published stories yet"
          description={`${displayName} hasn't published any stories yet.`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 pt-10 lg:gap-20">
      <section aria-labelledby="author-latest-heading" className="flex flex-col gap-8">
        <h2 id="author-latest-heading" className="font-serif text-3xl font-bold text-ink">
          Latest from {displayName}
        </h2>
        <StoryCard post={newest} variant="horizontal" />
      </section>

      {videos.length > 0 ? (
        <section aria-labelledby="author-home-videos-heading" className="flex flex-col gap-8">
          <SectionHeading
            id="author-home-videos-heading"
            title="Videos"
            action={{ href: channelHref(username, "videos"), label: "View all" }}
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 3).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      ) : null}

      {topics.slice(0, 4).map((topic) => (
        <section key={topic.slug} aria-labelledby={`author-topic-${topic.slug}`} className="flex flex-col gap-8">
          <SectionHeading
            id={`author-topic-${topic.slug}`}
            title={topic.name}
            action={{ href: channelHref(username, "stories", topic.slug), label: "View all" }}
          />
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {stories
              .filter((post) => postInCategory(post, topic.slug))
              .slice(0, 3)
              .map((post) => (
                <StoryCard key={post.id} post={post} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
