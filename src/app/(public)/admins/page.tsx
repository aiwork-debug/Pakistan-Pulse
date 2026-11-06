import type { Metadata } from "next";
import { Users } from "lucide-react";
import Link from "next/link";
import { AuthorCard } from "@/components/feed/author-card";
import { EmptyState } from "@/components/feed/empty-state";
import { getAdminProfiles } from "@/lib/data";
import { buttonPrimary, kicker } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Admins",
  description: "The admins who write, edit, and publish stories on Pulse.",
};

/*
 * Dummy page content for local development. The text is generic on purpose and makes no
 * claims about any named person; real bios replace it once each admin's account is set up.
 */
const RESPONSIBILITIES = [
  { title: "Write and publish", text: "Each admin writes their own stories and publishes them directly to Pulse." },
  { title: "Check before it goes live", text: "Admins verify names, figures, and quotes in their own work before publishing." },
  { title: "Correct in the open", text: "When a story needs a fix, the admin updates it and notes the change." },
];

export default async function AdminsPage() {
  const admins = await getAdminProfiles();
  const sorted = [...admins].sort((a, b) => {
    if (a.status !== b.status) return a.status === "ACTIVE" ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });
  const activeCount = admins.filter((admin) => admin.status === "ACTIVE").length;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      <header className="flex flex-col gap-6 border-b border-border py-12 sm:py-16">
        <p className={kicker}>Our team</p>
        <h1 className="font-serif text-5xl leading-tight font-bold text-ink lg:text-6xl">Admins</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          The people who write, edit, and publish stories on Pulse. Full profiles are on the way.
        </p>
        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted">Admins</dt>
            <dd className="font-serif text-3xl font-bold text-ink">{admins.length}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted">Publishing now</dt>
            <dd className="font-serif text-3xl font-bold text-ink">{activeCount}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="admins-heading" className="flex flex-col gap-10 py-16 lg:py-24">
        <h2 id="admins-heading" className="border-t-2 border-primary pt-4 font-serif text-3xl font-bold text-ink">
          Meet the admins
        </h2>
        {sorted.length > 0 ? (
          <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {sorted.map((admin) => (
              <li key={admin.id} className="flex">
                <AuthorCard
                  author={admin}
                  variant="compact"
                  headingLevel="h3"
                  role={admin.status === "ACTIVE" ? "Admin" : "Admin · Profile pending"}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Users} headingLevel="h3" title="Admin profiles coming soon" />
        )}
      </section>

      <section
        aria-labelledby="role-heading"
        className="grid gap-10 rounded-xl border border-border bg-surface p-8 sm:p-12 lg:grid-cols-12"
      >
        <div className="lg:col-span-5">
          <h2 id="role-heading" className="font-serif text-3xl font-bold text-ink">
            What an admin does
          </h2>
        </div>
        <ul className="grid gap-8 md:grid-cols-3 lg:col-span-12">
          {RESPONSIBILITIES.map((item) => (
            <li key={item.title} className="flex flex-col gap-3 border-t-2 border-primary pt-6">
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <p className="text-base leading-7 text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="admins-cta-heading"
        className="mt-16 flex flex-col items-start gap-6 rounded-xl border border-primary/20 bg-primary/5 p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14 lg:mt-24"
      >
        <div className="flex flex-col gap-3">
          <h2 id="admins-cta-heading" className="font-serif text-3xl font-bold text-ink">
            Want to reach an admin?
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted">
            Send a message to the newsroom and we will pass it on.
          </p>
        </div>
        <Link href="/contact" className={buttonPrimary}>
          Contact the newsroom
        </Link>
      </section>
    </div>
  );
}
