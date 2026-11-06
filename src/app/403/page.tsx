import type { Metadata } from "next";
import { Lock } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { roleLabel } from "@/lib/can";
import { getSession } from "@/lib/session";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

export default async function ForbiddenPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <BrandMark />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center lg:py-24">
          <Lock aria-hidden="true" className="size-10 text-primary" />
          <h1 className="font-serif text-4xl leading-tight font-bold text-ink">
            You don&apos;t have access to this page
          </h1>
          <p className="text-lg leading-8 text-muted">
            Your account doesn&apos;t have permission to view this area. If you think this is a
            mistake, sign in with a different account.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className={buttonPrimary}>
              Go to home
            </Link>
            <Link href="/login" className={buttonSecondary}>
              Switch account
            </Link>
          </div>
          <p className="text-sm text-muted">
            Current role: {session ? roleLabel(session.role) : "Not signed in"}
          </p>
        </div>
      </main>
    </div>
  );
}
