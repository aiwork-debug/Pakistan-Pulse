import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignOutEverywhere } from "@/components/account/sign-out-everywhere";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sessions",
  robots: { index: false, follow: false },
};

export default async function SessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Sessions</h1>
        <p className="text-sm text-muted">Manage where your account is signed in.</p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-paper p-6">
        <h2 className="text-lg font-semibold text-ink">This device</h2>
        <p className="text-base leading-7 text-ink">
          You are signed in as <strong>{session.email}</strong>.
        </p>
        <p className="text-sm text-muted">
          If you think someone else has access to your account, sign out everywhere and then reset
          your password.
        </p>
        <SignOutEverywhere />
      </section>
    </div>
  );
}
