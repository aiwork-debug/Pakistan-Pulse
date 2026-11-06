import type { Metadata } from "next";
import { clsx } from "clsx";
import { Clapperboard, FolderOpen, Newspaper } from "lucide-react";
import Link from "next/link";
import { AdminSlider } from "@/components/feed/admin-slider";
import { CategoryGrid } from "@/components/feed/category-grid";
import { DeskSection } from "@/components/feed/desk-section";
import { EmptyState } from "@/components/feed/empty-state";
import { SectionHeading } from "@/components/feed/section-heading";
import { StatTiles } from "@/components/feed/stat-tiles";
import { StoryCard } from "@/components/feed/story-card";
import { StoryThumbList } from "@/components/feed/story-thumb-list";
import { VideoCard } from "@/components/feed/video-card";
import { buildCategoryTree } from "@/lib/categories";
import {
  getAdminProfiles,
  getCategoriesWithCounts,
  getHomepagePins,
  getLatestPosts,
  getOldestPosts,
  getPostsByAuthor,
  getSiteStats,
  getVideoItems,
  listPublishedPosts,
} from "@/lib/data";
import { resolveHomepage } from "@/lib/homepage";
import type { VideoItem } from "@/lib/types";
import { buttonPrimary, buttonSecondary, inputBase } from "@/lib/ui";

export const metadata: Metadata = {
  title: { absolute: "Pulse | Independent News" },
  description:
    "Independent reporting on politics, the economy, cities, technology, environment, education, and sport.",
  openGraph: {
    title: "Pulse | Independent News",
    description:
      "Independent reporting on politics, the economy, cities, technology, environment, education, and sport.",
    type: "website",
  },
};

const container = "mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8";
const section = "flex flex-col gap-10 py-16 lg:py-24";

/** The section given its own desk on the homepage, below the front page. */
const DESK_SLUG = "politics";

function uniqueByPost(items: VideoItem[], limit: number): VideoItem[] {
  const seen = new Set<string>();
  const result: VideoItem[] = [];
  for (const item of items) {
    if (seen.has(item.post.id)) continue;
    seen.add(item.post.id);
    result.push(item);
    if (result.length === limit) break;
  }
  return result;
}

export default async function HomePage() {
  const [latestPosts, pins, oldestPosts, categoryCounts, stats, videoItems, deskResult, adminProfiles] = await Promise.all([
    getLatestPosts(30),
    getHomepagePins(),
    getOldestPosts(8),
    getCategoriesWithCounts(),
    getSiteStats(),
    getVideoItems({ limit: 30 }),
    listPublishedPosts({ categorySlug: DESK_SLUG, pageSize: 10 }),
    getAdminProfiles(),
  ]);
  const categories = buildCategoryTree(categoryCounts);

  // Slot 1 is the main story and slots 2-5 sit beside it: pinned by a super admin at
  // /control/homepage, otherwise filled with the newest stories.
  const { slots, rest } = resolveHomepage(latestPosts, pins);
  const frontStories = slots.map((entry) => entry.post);
  const frontIds = new Set(slots.map((entry) => entry.post.id));

  // Each story appears once: front page, then the section desk, then the Latest grid.
  const deskSection = categories.find((category) => category.slug === DESK_SLUG);
  const deskPosts = deskResult.items.filter((post) => !frontIds.has(post.id)).slice(0, 5);
  const deskIds = new Set(deskPosts.map((post) => post.id));
  const remaining = rest.filter((post) => !deskIds.has(post.id));
  const latest = remaining.slice(0, 6);
  const shownIds = new Set([...slots.map((entry) => entry.post), ...deskPosts, ...latest].map((post) => post.id));
  const picks =
    stats.publishedStories >= 3 ? oldestPosts.filter((post) => !shownIds.has(post.id)).slice(0, 2) : [];
  const videos = uniqueByPost(videoItems, 3);
  // Active admins first, then by name, for the slider beside Top stories.
  const admins = [...adminProfiles].sort((a, b) => {
    if (a.status !== b.status) return a.status === "ACTIVE" ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });
  // A few recent stories per active admin, shown as small cards under their slide.
  const adminPosts = await Promise.all(
    admins.map((admin) => (admin.status === "ACTIVE" ? getPostsByAuthor(admin.id) : Promise.resolve([]))),
  );
  const postsByAdmin = Object.fromEntries(admins.map((admin, index) => [admin.id, adminPosts[index].slice(0, 3)]));

  return (
    <>
      <h1 className="sr-only">Pulse: independent news</h1>

      {/* 1. Front page */}
      <section aria-label="Top stories" className={clsx(container, "pt-6 pb-4 lg:pt-10")}>
        {frontStories.length > 0 ? (
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div
              className={clsx(
                "lg:col-span-4",
                admins.length > 0 ? "order-last lg:order-first" : "lg:col-span-12",
              )}
            >
              <StoryThumbList posts={frontStories} />
            </div>
            {admins.length > 0 ? (
              <div className="lg:col-span-8">
                <AdminSlider admins={admins} postsByAdmin={postsByAdmin} />
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon={Newspaper}
            title="No stories published yet"
            description="The newsroom is preparing its first stories. Check back soon."
            action={{ href: "/about", label: "About Pulse" }}
          />
        )}
      </section>

      <div className={container}>
        {/* 2. Section desk (hidden when the section has no further stories) */}
        {deskSection && deskPosts.length > 0 ? (
          <div className="py-16 lg:py-24">
            <DeskSection section={deskSection} posts={deskPosts} />
          </div>
        ) : null}

        {/* 4. Categories */}
        <section aria-labelledby="categories-heading" className={clsx(section, "pt-0 lg:pt-0")}>
          <SectionHeading
            id="categories-heading"
            title="Categories"
            action={{ href: "/categories", label: "View all" }}
          />
          {categories.length > 0 ? (
            <CategoryGrid categories={categories} />
          ) : (
            <EmptyState icon={FolderOpen} headingLevel="h3" title="No categories yet" />
          )}
        </section>

        {/* 5. Latest stories */}
        <section aria-labelledby="latest-heading" className={clsx(section, "pt-0 lg:pt-0")}>
          <SectionHeading id="latest-heading" title="Latest stories" action={{ href: "/news", label: "View all" }} />
          {latest.length > 0 ? (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((post) => (
                <StoryCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Newspaper}
              headingLevel="h3"
              title="More stories coming soon"
              description="New reporting appears here as the newsroom publishes it."
              action={{ href: "/news", label: "Browse news" }}
            />
          )}
        </section>

        {/* 6. Editor's picks (hidden when there are fewer than 3 stories) */}
        {picks.length > 0 ? (
          <section aria-labelledby="picks-heading" className={clsx(section, "pt-0 lg:pt-0")}>
            <SectionHeading id="picks-heading" title="Editor's picks" />
            <div className="grid gap-8 lg:grid-cols-2">
              {picks.map((post) => (
                <StoryCard key={post.id} post={post} variant="horizontal" />
              ))}
            </div>
          </section>
        ) : null}

        {/* 7. By the numbers */}
        <section aria-labelledby="numbers-heading" className={clsx(section, "pt-0 lg:pt-0")}>
          <SectionHeading id="numbers-heading" title="By the numbers" />
          <StatTiles stats={stats} />
        </section>

        {/* 8. Videos */}
        <section aria-labelledby="videos-heading" className={clsx(section, "pt-0 lg:pt-0")}>
          <SectionHeading id="videos-heading" title="Videos" action={{ href: "/videos", label: "View all" }} />
          {videos.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clapperboard}
              headingLevel="h3"
              title="No videos yet"
              description="Stories with video or YouTube embeds will appear here."
            />
          )}
        </section>

        {/* 9. Newsletter */}
        <section
          aria-labelledby="newsletter-heading"
          className="grid gap-8 rounded-xl border border-border bg-surface p-8 sm:p-12 lg:grid-cols-12 lg:items-center"
        >
          <div className="flex flex-col gap-3 lg:col-span-6">
            <h2 id="newsletter-heading" className="font-serif text-3xl font-bold text-ink">
              The Pulse briefing
            </h2>
            <p className="text-base leading-7 text-muted">
              The day&apos;s most important stories, explained in five minutes. Delivered every
              weekday morning.
            </p>
          </div>
          {/* No action yet. method="dialog" outside a <dialog> makes submitting a no-op. */}
          <form method="dialog" className="flex flex-col gap-3 lg:col-span-6">
            <label htmlFor="newsletter-email" className="text-sm font-semibold text-ink">
              Email address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-describedby="newsletter-note"
                className={clsx(inputBase, "h-11 flex-1 border-border")}
              />
              <button type="button" aria-disabled="true" aria-describedby="newsletter-note" className={buttonPrimary}>
                Subscribe
              </button>
            </div>
            <p id="newsletter-note" className="text-sm text-muted">
              Subscriptions open soon.
            </p>
          </form>
        </section>

        {/* 10. About strip */}
        <section aria-labelledby="about-strip-heading" className={clsx(section, "lg:grid lg:grid-cols-12 lg:items-end")}>
          <div className="flex flex-col gap-4 border-t-2 border-primary pt-4 lg:col-span-8">
            <h2 id="about-strip-heading" className="font-serif text-3xl font-bold text-ink">
              Reporting that stays close to the story
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              Pulse is an independent newsroom that explains the decisions shaping everyday life,
              with every claim checked and every correction made in public.
            </p>
          </div>
          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <Link href="/about" className={buttonSecondary}>
              Learn about Pulse
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
