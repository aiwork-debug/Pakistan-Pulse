import type { Metadata } from "next";
import { clsx } from "clsx";
import { Pin, Sparkles } from "lucide-react";
import Link from "next/link";
import { HomepageSlotsForm } from "@/components/dashboard/homepage-slots-form";
import { CoverImage } from "@/components/ui/cover-image";
import { getHomepageEditor } from "@/lib/dashboard-data";
import { getHomepagePins, getLatestPosts } from "@/lib/data";
import { HOMEPAGE_SLOTS, resolveHomepage } from "@/lib/homepage";
import { requirePageRole } from "@/lib/session";
import { focusRing } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Homepage",
  robots: { index: false, follow: false },
};

export default async function HomepageControlPage() {
  const session = await requirePageRole("SUPER_ADMIN");

  const [editor, latest, pins] = await Promise.all([
    getHomepageEditor(session),
    getLatestPosts(HOMEPAGE_SLOTS.length * 2),
    getHomepagePins(),
  ]);
  const { slots } = resolveHomepage(latest, pins);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Homepage</h1>
        <p className="max-w-3xl text-sm text-muted">
          Choose which stories sit at the top of the homepage. Pin a story to a position, or leave it on
          Automatic to show the newest published story there. Only published stories can be pinned, and a
          pinned story drops off the homepage if its author unpublishes or archives it.
        </p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="homepage-positions" className="flex flex-col gap-4">
          <h2 id="homepage-positions" className="text-lg font-semibold text-ink">
            Positions
          </h2>
          {editor.options.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-paper p-8 text-center text-sm text-muted">
              No published stories yet. Once admins publish stories, you can pin them here.
            </p>
          ) : (
            <HomepageSlotsForm options={editor.options} assignments={editor.assignments} />
          )}
        </section>

        <section aria-labelledby="homepage-live" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="homepage-live" className="text-lg font-semibold text-ink">
              Live now
            </h2>
            <Link href="/" target="_blank" className={clsx("rounded-sm text-sm font-semibold text-primary hover:underline", focusRing)}>
              Open homepage<span className="sr-only"> (opens in a new tab)</span>
            </Link>
          </div>
          {slots.length === 0 ? (
            <p className="text-sm text-muted">The homepage has no stories yet.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {slots.map(({ slot, post, pinned }) => {
                const label = HOMEPAGE_SLOTS.find((entry) => entry.slot === slot)?.label ?? `Position ${slot}`;
                return (
                  <li key={slot} className="flex gap-3 rounded-lg border border-border bg-paper p-3">
                    <CoverImage
                      src={post.coverImageUrl}
                      alt=""
                      gradient={post.coverGradient}
                      sizes="96px"
                      className="aspect-[4/3] w-24 shrink-0 rounded-md"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
                        {pinned ? (
                          <Pin aria-hidden="true" className="size-3.5" />
                        ) : (
                          <Sparkles aria-hidden="true" className="size-3.5" />
                        )}
                        {label} · {pinned ? "Pinned" : "Automatic"}
                      </p>
                      <p className="line-clamp-2 text-sm font-semibold text-ink">{post.title}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
