import type { Metadata } from "next";
import { Clapperboard, Newspaper } from "lucide-react";
import { notFound } from "next/navigation";
import { CategoryPills, type PillItem } from "@/components/feed/category-pills";
import { ChannelHeader } from "@/components/feed/channel-header";
import { ChannelHome } from "@/components/feed/channel-home";
import { ChannelTabs } from "@/components/feed/channel-tabs";
import { EmptyState } from "@/components/feed/empty-state";
import { StoryCard } from "@/components/feed/story-card";
import { VideoCard } from "@/components/feed/video-card";
import { ToastMessage } from "@/components/ui/toast-message";
import { roleLabel } from "@/lib/can";
import { postInCategory, topicsFromPosts, type Topic } from "@/lib/categories";
import { channelHref, parseChannelTab, type ChannelTabKey } from "@/lib/channel";
import { getAuthorByUsername, getPostsByAuthor, getVideoItems } from "@/lib/data";
import { absoluteUrl } from "@/lib/format";
import type { PostSummary, VideoItem } from "@/lib/types";

type AuthorPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Finds a section or subcategory among the author's topics. */
function findTopic(topics: Topic[], slug: string | undefined) {
  if (!slug) return null;
  for (const topic of topics) {
    if (topic.slug === slug) return { section: topic, child: null };
    const child = topic.children.find((candidate) => candidate.slug === slug);
    if (child) return { section: topic, child };
  }
  return null;
}

export async function generateMetadata({ params, searchParams }: AuthorPageProps): Promise<Metadata> {
  const { username } = await params;
  const query = await searchParams;
  const author = await getAuthorByUsername(username);
  if (!author) return { title: "Author not found", robots: { index: false, follow: false } };
  const filtered = Boolean(first(query.tab) || first(query.topic));
  return {
    title: author.displayName,
    description: author.bio || `Stories by ${author.displayName} at Pulse.`,
    openGraph: { type: "profile", title: author.displayName, description: author.bio },
    // Tab and topic views are variations of the same page.
    alternates: { canonical: `/authors/${author.username}` },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Uses public_profiles data only (no email or private fields). */
export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { username } = await params;
  const query = await searchParams;
  const author = await getAuthorByUsername(username);
  if (!author) notFound();

  const unavailable = author.status !== "ACTIVE";
  const [stories, videos]: [PostSummary[], VideoItem[]] = unavailable
    ? [[], []]
    : await Promise.all([getPostsByAuthor(author.id), getVideoItems({ authorId: author.id })]);

  const topics = topicsFromPosts(stories);
  const tab = parseChannelTab(first(query.tab));
  const selected = findTopic(topics, first(query.topic));
  const selectedSlug = selected?.child?.slug ?? selected?.section.slug;

  const filteredStories = selectedSlug ? stories.filter((post) => postInCategory(post, selectedSlug)) : stories;
  const filteredVideos = selectedSlug
    ? videos.filter((video) => postInCategory(video.post, selectedSlug))
    : videos;

  // "What this author covers" chips: All, each section, then the active section's subcategories.
  const filterTab: ChannelTabKey = tab === "home" ? "stories" : tab;
  const sectionPills: PillItem[] = [
    { label: "All", href: channelHref(author.username, filterTab), active: !selected },
    ...topics.map((topic) => ({
      label: topic.name,
      href: channelHref(author.username, filterTab, topic.slug),
      count: topic.count,
      active:
        selected?.section.slug === topic.slug ? (selected.child ? ("ancestor" as const) : true) : false,
    })),
  ];
  const childPills: PillItem[] =
    selected && selected.section.children.length > 0
      ? selected.section.children.map((child) => ({
          label: child.name,
          href: channelHref(author.username, filterTab, child.slug),
          count: child.count,
          active: selected.child?.slug === child.slug,
        }))
      : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.displayName,
    description: author.bio,
    url: absoluteUrl(`/authors/${author.username}`),
    worksFor: { "@type": "Organization", name: "Pulse" },
  };

  const role = `${roleLabel(author.role)}, Pulse newsroom`;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <ChannelHeader
        author={author}
        role={role}
        stats={unavailable ? undefined : { stories: stories.length, videos: videos.length }}
        topics={topics}
      />

      {unavailable ? (
        <ToastMessage tone="warning" role="status" className="mt-10">
          This author&apos;s stories are not currently available.
        </ToastMessage>
      ) : (
        <>
          <div className="mt-8">
            <ChannelTabs
              label={`${author.displayName}'s channel`}
              tabs={[
                { label: "Home", href: channelHref(author.username, "home"), active: tab === "home" },
                {
                  label: "Stories",
                  href: channelHref(author.username, "stories", selectedSlug),
                  active: tab === "stories",
                  count: stories.length,
                },
                {
                  label: "Videos",
                  href: channelHref(author.username, "videos", selectedSlug),
                  active: tab === "videos",
                  count: videos.length,
                },
              ]}
            />
          </div>

          {topics.length > 0 ? (
            <div className="flex flex-col gap-3 border-b border-border py-5">
              <CategoryPills label={`Filter ${author.displayName}'s work by section`} items={sectionPills} />
              {childPills.length > 0 ? (
                <CategoryPills
                  label={`Filter ${selected?.section.name ?? ""} by subcategory`}
                  items={childPills}
                  size="sm"
                />
              ) : null}
            </div>
          ) : null}

          {tab === "home" ? (
            <ChannelHome
              username={author.username}
              displayName={author.displayName}
              stories={stories}
              videos={videos}
              topics={topics}
            />
          ) : null}

          {tab === "stories" ? (
            <section aria-labelledby="author-stories-heading" className="flex flex-col gap-8 pt-10">
              <h2 id="author-stories-heading" className="font-serif text-3xl font-bold text-ink">
                {selected ? `${(selected.child ?? selected.section).name} stories` : `Stories by ${author.displayName}`}
              </h2>
              <p role="status" className="-mt-4 text-sm text-muted">
                Showing {filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"}
              </p>
              {filteredStories.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  headingLevel="h3"
                  title="No published stories yet"
                  description={`${author.displayName} hasn't published any stories here yet.`}
                  action={selected ? { href: channelHref(author.username, "stories"), label: "Show all stories" } : undefined}
                />
              ) : (
                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredStories.map((post) => (
                    <StoryCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === "videos" ? (
            <section aria-labelledby="author-videos-heading" className="flex flex-col gap-8 pt-10">
              <h2 id="author-videos-heading" className="font-serif text-3xl font-bold text-ink">
                {selected ? `${(selected.child ?? selected.section).name} videos` : `Videos by ${author.displayName}`}
              </h2>
              {filteredVideos.length === 0 ? (
                <EmptyState
                  icon={Clapperboard}
                  headingLevel="h3"
                  title="No videos here yet"
                  description="Stories with uploaded video or YouTube embeds appear here."
                  action={selected ? { href: channelHref(author.username, "videos"), label: "Show all videos" } : undefined}
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
