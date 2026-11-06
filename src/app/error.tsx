"use client";

import Link from "next/link";
import { ErrorState } from "@/components/feed/error-state";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main id="main-content" className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <meta name="robots" content="noindex, nofollow" />
      <title>Something went wrong | Pulse</title>
      <ErrorState
        title="Something went wrong"
        description="We hit an unexpected problem loading this page. Please try again."
        detail={error.digest ? `Error reference: ${error.digest}` : undefined}
      >
        <button type="button" onClick={reset} className={buttonPrimary}>
          Try again
        </button>
        <Link href="/" className={buttonSecondary}>
          Go to home
        </Link>
      </ErrorState>
    </main>
  );
}
