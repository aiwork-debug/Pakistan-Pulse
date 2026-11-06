import type { Metadata } from "next";
import { clsx } from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { focusRing } from "@/lib/ui";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface px-4 py-12 sm:py-16">
      <BrandMark size="sm" />
      <main
        id="main-content"
        className="mt-8 w-full max-w-md rounded-xl border border-border bg-paper p-6 shadow-sm sm:p-8"
      >
        {children}
      </main>
      <Link href="/" className={clsx("mt-8 rounded-sm text-sm font-medium text-muted hover:text-primary", focusRing)}>
        Back to Pulse home
      </Link>
    </div>
  );
}
