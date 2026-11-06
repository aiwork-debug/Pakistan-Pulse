import type { Metadata } from "next";
import { clsx } from "clsx";
import { Search, SearchX } from "lucide-react";
import { CategoryPills, type PillItem } from "@/components/feed/category-pills";
import { EmptyState } from "@/components/feed/empty-state";
import { Pagination } from "@/components/feed/pagination";
import { StoryCard } from "@/components/feed/story-card";
import { categoryTree } from "@/lib/categories";
import { getCategories, listPublishedPosts, type SortOrder } from "@/lib/data";
import { buttonPrimary, buttonSecondary, focusRing, inputBase, kicker } from "@/lib/ui";

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type NewsPageProps = {
  searchParams: SearchParams;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: NewsPageProps): Promise<Metadata> {
  const q = first((await searchParams).q)?.trim();
  return {
    title: "News",
    description:
      "Browse every published story across politics, economy, cities, technology, environment, education, and sport.",
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

function buildHref(params: { q?: string; category?: string; sort?: SortOrder }) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.sort === "oldest") search.set("sort", "oldest");
  const query = search.toString();
  return query ? `/news?${query}` : "/news";
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";
  const sort: SortOrder = first(params.sort) === "oldest" ? "oldest" : "newest";
  const requestedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

  const categories = await getCategories();
  const categoryParam = first(params.category);
  const activeCategory = categories.find((category) => category.slug === categoryParam);
  // The section whose subcategories are shown: the active section, or the active subcategory's parent.
  const sections = categoryTree(categories);
  const activeSection = activeCategory
    ? sections.find((section) => section.id === (activeCategory.parentId ?? activeCategory.id))
    : undefined;

  const result = await listPublishedPosts({
    categorySlug: activeCategory?.slug,
    q,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const pills: PillItem[] = [
    { label: "All", href: buildHref({ q, sort }), active: !activeCategory },
    ...sections.map((section) => ({
      label: section.name,
      href: buildHref({ q, sort, category: section.slug }),
      active: activeCategory?.id === section.id ? true : activeSection?.id === section.id ? ("ancestor" as const) : false,
    })),
  ];
  const subPills: PillItem[] =
    activeSection && activeSection.children.length > 0
      ? [
          {
            label: `All ${activeSection.name}`,
            href: buildHref({ q, sort, category: activeSection.slug }),
            active: activeCategory?.id === activeSection.id,
          },
          ...activeSection.children.map((child) => ({
            label: child.name,
            href: buildHref({ q, sort, category: child.slug }),
            active: activeCategory?.id === child.id,
          })),
        ]
      : [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      <header className="flex flex-col gap-6 py-12 sm:py-16">
        <p className={kicker}>All stories</p>
        <h1 className="font-serif text-5xl leading-tight font-bold text-ink lg:text-6xl">News</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          Every published story. Search, filter by topic, or change the order.
        </p>

        <form role="search" method="get" action="/news" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="news-search" className="sr-only">
            Search stories
          </label>
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
            />
            <input
              id="news-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search headlines and summaries"
              className={clsx(inputBase, "h-12 border-border pr-4 pl-12")}
            />
          </div>
          {activeCategory ? <input type="hidden" name="category" value={activeCategory.slug} /> : null}
          {sort === "oldest" ? <input type="hidden" name="sort" value="oldest" /> : null}
          <button type="submit" className={clsx(buttonPrimary, "h-12")}>
            Search
          </button>
        </form>
      </header>

      {/* Filter bar: sticky under the navbar on desktop. */}
      <div className="z-30 -mx-4 border-y border-border bg-paper px-4 py-4 sm:-mx-6 sm:px-6 lg:sticky lg:top-[72px] lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <CategoryPills label="Filter by section" items={pills} />
            {subPills.length > 0 ? (
              <CategoryPills
                label={`Filter ${activeSection?.name ?? ""} by subcategory`}
                items={subPills}
                size="sm"
              />
            ) : null}
          </div>
          <form method="get" action="/news" className="flex items-center gap-2">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {activeCategory ? <input type="hidden" name="category" value={activeCategory.slug} /> : null}
            <label htmlFor="news-sort" className="text-sm font-medium text-ink">
              Sort
            </label>
            <select
              id="news-sort"
              name="sort"
              defaultValue={sort}
              className={clsx("h-10 rounded-md border border-border bg-paper px-3 text-sm text-ink", focusRing)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button type="submit" className={clsx(buttonSecondary, "h-10 px-4")}>
              Apply
            </button>
          </form>
        </div>
      </div>

      <section aria-labelledby="results-heading" className="pt-10">
        <h2 id="results-heading" className="sr-only">
          Results
        </h2>
        <p role="status" className="mb-10 text-sm text-muted">
          Showing {result.total} {result.total === 1 ? "story" : "stories"}
          {activeCategory ? ` in ${activeCategory.name}` : ""}
          {q ? ` matching "${q}"` : ""}
        </p>

        {result.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            headingLevel="h3"
            title={result.total === 0 && !q && !activeCategory ? "No stories published yet" : "No stories found"}
            description="Try a different search term or remove the category filter."
            action={{ href: "/news", label: "Clear filters" }}
          />
        ) : (
          <>
            <div className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
              {result.items.map((post) => (
                <StoryCard key={post.id} post={post} className="mb-12 break-inside-avoid" />
              ))}
            </div>
            {result.total > PAGE_SIZE ? (
              <div className="mt-8">
                <Pagination
                  pathname="/news"
                  currentPage={Math.min(page, totalPages)}
                  totalPages={totalPages}
                  params={{
                    q: q || undefined,
                    category: activeCategory?.slug,
                    sort: sort === "oldest" ? "oldest" : undefined,
                  }}
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
