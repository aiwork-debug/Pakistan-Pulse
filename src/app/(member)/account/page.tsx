import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardHrefFor, roleLabel } from "@/lib/can";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { avatarPhotoFor } from "@/lib/avatars";
import { getSession } from "@/lib/session";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Your account</h1>
        <p className="text-sm text-muted">Your profile and sign-in details.</p>
      </header>

      <section className="flex flex-col gap-6 rounded-xl border border-border bg-paper p-6 sm:flex-row sm:items-center">
        <PersonAvatar
          name={session.name}
          gradient={session.avatarGradient}
          photoUrl={avatarPhotoFor(session.username)}
          initials={session.initials}
          className="size-16 text-xl"
          sizes="64px"
        />
        <dl className="flex-1 text-sm">
          <dt className="sr-only">Name</dt>
          <dd className="text-lg font-semibold text-ink">{session.name}</dd>
          <dt className="sr-only">Username and role</dt>
          <dd className="text-muted">
            @{session.username} · {roleLabel(session.role)}
          </dd>
          <dt className="sr-only">Email</dt>
          <dd className="text-muted">{session.email}</dd>
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href={dashboardHrefFor(session.role)} className={buttonPrimary}>
          Go to dashboard
        </Link>
        <Link href="/account/profile" className={buttonSecondary}>
          Edit profile
        </Link>
        <Link href="/account/sessions" className={buttonSecondary}>
          Sessions
        </Link>
      </div>
    </div>
  );
}
