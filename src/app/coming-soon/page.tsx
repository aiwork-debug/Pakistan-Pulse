import type { Metadata } from "next";
import { Newspaper, ShieldCheck, Users } from "lucide-react";
import { SiteGateForm } from "@/components/coming-soon/site-gate-form";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: { absolute: "Pulse | Coming soon" },
  description: "Pulse, an independent news platform, is launching soon.",
  robots: { index: false, follow: false },
};

type ComingSoonPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

const highlights = [
  { icon: Newspaper, label: "Independent reporting" },
  { icon: Users, label: "Journalists you know" },
  { icon: ShieldCheck, label: "Checked before it's published" },
] as const;

/** Pre-launch page. The middleware sends every visitor here until they enter the team password. */
export default async function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  const { next } = await searchParams;
  const target = safeNext(Array.isArray(next) ? next[0] : next, "/");

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-linear-to-br from-ink via-ink to-primary text-paper">
      {/* Decorative rings and glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <span className="absolute top-1/2 left-1/2 size-160 -translate-1/2 rounded-full border border-paper/5" />
        <span className="absolute top-1/2 left-1/2 size-112 -translate-1/2 rounded-full border border-paper/10" />
        <span className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/40 blur-3xl" />
        <span className="absolute -bottom-40 -left-40 size-96 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-[1280px] items-center px-4 py-6 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-md bg-primary font-serif text-xl font-bold text-paper ring-1 ring-paper/20"
          >
            P
          </span>
          <span className="font-serif text-2xl font-bold tracking-tight">Pulse</span>
        </span>
      </header>

      <main
        id="main-content"
        className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16"
      >
        <div className="flex flex-col gap-6 motion-safe:animate-fade-up lg:col-span-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-paper/10 px-3 py-1.5 text-xs font-bold tracking-[0.18em] uppercase backdrop-blur">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-paper/70 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-paper" />
            </span>
            Coming soon
          </span>
          <h1 className="font-serif text-4xl leading-[1.1] font-bold text-balance sm:text-5xl lg:text-6xl">
            Independent news, launching soon.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-paper/75">
            Pulse is getting ready to bring you reporting that stays close to the story. We&apos;re putting
            the finishing touches in place and will be live shortly.
          </p>
          <ul className="flex flex-wrap gap-3">
            {highlights.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-md border border-paper/15 bg-paper/5 px-3 py-2 text-sm text-paper/85"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <section
          aria-labelledby="team-access-heading"
          className="w-full rounded-xl bg-paper p-6 text-ink shadow-2xl motion-safe:animate-fade-up sm:p-8 lg:col-span-5 lg:justify-self-end lg:max-w-md"
          style={{ animationDelay: "150ms" }}
        >
          <h2 id="team-access-heading" className="text-xl font-semibold">
            Team access
          </h2>
          <p className="mt-2 mb-6 text-sm leading-6 text-muted">
            This site is not public yet. Enter the team password to preview it.
          </p>
          <SiteGateForm next={target} />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1280px] px-4 py-6 text-sm text-paper/60 sm:px-6 lg:px-8">
        © 2026 Pulse. All rights reserved.
      </footer>
    </div>
  );
}
