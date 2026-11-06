import type { Metadata } from "next";
import Link from "next/link";
import { StoryCard } from "@/components/feed/story-card";
import { BrandMark } from "@/components/layout/brand-mark";
import { getLatestPosts } from "@/lib/data";
import type { PostSummary } from "@/lib/types";
import { buttonPrimary, buttonSecondary, kicker } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  let suggestions: PostSummary[] = [];
  try {
    suggestions = await getLatestPosts(3);
  } catch {
    // The 404 page must still render if the data source is unavailable.
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <BrandMark />
        </div>
      </header>
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <p className={kicker}>Error 404</p>
            <h1 className="font-serif text-5xl leading-tight font-bold text-ink">We couldn&apos;t find that page</h1>
            <p className="text-lg leading-8 text-muted">
              The link may be broken, or the story may have moved.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/" className={buttonPrimary}>
                Go to home
              </Link>
              <Link href="/news" className={buttonSecondary}>
                Browse news
              </Link>
            </div>
          </div>

          {suggestions.length > 0 ? (
            <section aria-labelledby="suggested-heading" className="mx-auto mt-16 max-w-3xl">
              <h2 id="suggested-heading" className="border-t-2 border-primary pt-4 font-serif text-2xl font-bold text-ink">
                Latest stories
              </h2>
              <div className="mt-8 grid gap-8 md:grid-cols-3">
                {suggestions.map((post) => (
                  <StoryCard key={post.id} post={post} variant="compact" />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
