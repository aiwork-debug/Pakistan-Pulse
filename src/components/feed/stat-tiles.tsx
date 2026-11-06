import type { SiteStats } from "@/lib/types";

type StatTilesProps = {
  stats: SiteStats;
};

/** Real counts from the database. Zero is shown as zero, never padded with fake numbers. */
export function StatTiles({ stats }: StatTilesProps) {
  const tiles = [
    { label: "Published stories", value: stats.publishedStories },
    { label: "Categories", value: stats.categories },
    { label: "Active contributors", value: stats.activeContributors },
    { label: "Videos", value: stats.videos },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col-reverse gap-2 bg-paper p-6 lg:p-8">
          <dt className="text-sm font-medium text-muted">{tile.label}</dt>
          <dd className="font-serif text-4xl font-bold text-primary lg:text-5xl">
            {tile.value.toLocaleString("en-GB")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
