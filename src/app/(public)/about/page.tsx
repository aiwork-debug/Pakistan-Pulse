import type { Metadata } from "next";
import { Users } from "lucide-react";
import Link from "next/link";
import { AuthorCard } from "@/components/feed/author-card";
import { EmptyState } from "@/components/feed/empty-state";
import { getTeam } from "@/lib/data";
import { buttonPrimary, kicker } from "@/lib/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Who we are, how we publish, and the editors and writers behind Pulse.",
};

const VALUES = [
  { title: "Accuracy first", text: "Every claim is sourced and checked before it is published." },
  { title: "Open corrections", text: "When we get something wrong, we say so clearly and fix it in public." },
  { title: "Human stories", text: "Numbers matter, but we always show what they mean for the people living with them." },
];

const PROCESS = [
  { title: "Reporting", text: "Reporters gather documents, data, and first-hand accounts, and keep notes on every source." },
  { title: "Editing and fact-checking", text: "Each story is checked for names, figures, and quotes before it goes live." },
  { title: "Publishing and corrections", text: "We publish with dates and bylines, update openly, and log every change." },
];

export default async function AboutPage() {
  const team = await getTeam();

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      {/* Intro */}
      <section aria-labelledby="about-heading" className="mx-auto max-w-3xl py-16 text-center lg:py-24">
        <p className={kicker}>About us</p>
        <h1 id="about-heading" className="mt-6 font-serif text-5xl leading-tight font-bold text-ink lg:text-6xl">
          Reporting that stays close to the story
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted">
          Pulse is an independent platform for news and long-form reporting. A small newsroom
          team publishes multimedia stories on the economy, cities, technology, the environment,
          education, and sport.
        </p>
      </section>

      {/* Mission */}
      <section
        aria-labelledby="mission-heading"
        className="grid gap-12 border-y border-border py-16 lg:grid-cols-12 lg:gap-16 lg:py-24"
      >
        <div className="lg:col-span-5">
          <h2 id="mission-heading" className="font-serif text-3xl font-bold text-ink">
            Our mission
          </h2>
        </div>
        <div className="flex flex-col gap-6 text-lg leading-8 text-muted lg:col-span-7">
          <p>
            We believe readers deserve clear, verified information about the decisions that shape
            their lives. Our job is to explain complex issues without losing the people at their centre.
          </p>
          <p>
            Each story can combine text, photographs, video, and quoted posts from the wider
            conversation, so the evidence is visible and easy to check.
          </p>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values-heading" className="py-16 lg:py-24">
        <h2 id="values-heading" className="sr-only">
          Our values
        </h2>
        <ul className="grid gap-12 md:grid-cols-3 md:gap-10">
          {VALUES.map((value) => (
            <li key={value.title} className="flex flex-col gap-4 border-t-2 border-primary pt-6">
              <h3 className="font-serif text-2xl font-semibold text-ink">{value.title}</h3>
              <p className="text-base leading-7 text-muted">{value.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How we publish */}
      <section
        aria-labelledby="publish-heading"
        className="grid gap-10 rounded-xl border border-border bg-surface p-8 sm:p-12 lg:grid-cols-12"
      >
        <div className="lg:col-span-5">
          <h2 id="publish-heading" className="font-serif text-3xl font-bold text-ink">
            How we publish
          </h2>
        </div>
        <div className="flex flex-col gap-5 text-base leading-7 text-ink lg:col-span-7">
          <p>
            Every story on Pulse is written, checked, and published by the Pulse newsroom team.
          </p>
          <p>
            Our admins publish their own stories directly. There is no separate approval queue:
            each admin is responsible for checking their work before it goes live, and for
            correcting it openly if something is wrong.
          </p>
        </div>
        <ol className="grid gap-8 md:grid-cols-3 lg:col-span-12">
          {PROCESS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-full bg-primary font-serif text-lg font-bold text-paper"
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold text-ink">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="text-base leading-7 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Team */}
      <section aria-labelledby="team-heading" className="flex flex-col gap-10 py-16 lg:py-24">
        <h2 id="team-heading" className="border-t-2 border-primary pt-4 font-serif text-3xl font-bold text-ink">
          Meet the newsroom
        </h2>
        {team.length > 0 ? (
          <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {team.map((member) => (
              <li key={member.id} className="flex">
                <AuthorCard author={member} variant="compact" headingLevel="h3" className="w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Users} headingLevel="h3" title="Team profiles coming soon" />
        )}
      </section>

      {/* Call to action */}
      <section
        aria-labelledby="cta-heading"
        className="flex flex-col items-start gap-6 rounded-xl border border-primary/20 bg-primary/5 p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14"
      >
        <div className="flex flex-col gap-3">
          <h2 id="cta-heading" className="font-serif text-3xl font-bold text-ink">
            Have a story tip or a correction?
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted">
            We read every message. Share a tip or flag an error and our editors will follow up.
          </p>
        </div>
        <Link href="/contact" className={buttonPrimary}>
          Contact the newsroom
        </Link>
      </section>
    </div>
  );
}
