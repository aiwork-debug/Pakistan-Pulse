import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import { CategoryPills } from "@/components/feed/category-pills";
import { EmptyState } from "@/components/feed/empty-state";
import { VideoCard } from "@/components/feed/video-card";
import { getVideoItems } from "@/lib/data";
import type { VideoKind } from "@/lib/types";
import { kicker } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Videos",
  description: "Video reports and briefings from the Pulse newsroom.",
};

type VideosPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTERS: { label: string; type: VideoKind | null }[] = [
  { label: "All", type: null },
  { label: "Pulse", type: "uploaded" },
  { label: "YouTube", type: "youtube" },
];

function parseType(value: string | string[] | undefined): VideoKind | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "uploaded" || raw === "youtube" ? raw : null;
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const activeType = parseType((await searchParams).type);
  const videos = await getVideoItems({ kind: activeType ?? undefined });

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      <header className="flex flex-col gap-6 border-b border-border py-12 sm:py-16">
        <p className={kicker}>Watch</p>
        <h1 className="font-serif text-5xl leading-tight font-bold text-ink lg:text-6xl">Videos</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          Briefings, explainers, and footage from our reporting.
        </p>
        <CategoryPills
          label="Filter videos by source"
          items={FILTERS.map((filter) => ({
            label: filter.label,
            href: filter.type ? `/videos?type=${filter.type}` : "/videos",
            active: filter.type === activeType,
          }))}
        />
      </header>

      <section aria-label="Videos" className="pt-12">
        {videos.length === 0 ? (
          <EmptyState
            icon={Clapperboard}
            title="No videos here yet"
            description="Stories with uploaded video or YouTube embeds will appear here."
            action={activeType ? { href: "/videos", label: "Show all videos" } : undefined}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} headingLevel="h2" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
