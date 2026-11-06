import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToastMessage } from "@/components/ui/toast-message";
import { formatLongDate } from "@/lib/format";
import { kicker } from "@/lib/ui";

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

const POLICIES: Record<string, { title: string; updatedAt: string; summary: string }> = {
  editorial: {
    title: "Editorial policy",
    updatedAt: "2026-09-01T00:00:00Z",
    summary: "How we choose stories, source claims, separate news from opinion, and handle conflicts of interest.",
  },
  corrections: {
    title: "Corrections policy",
    updatedAt: "2026-10-14T00:00:00Z",
    summary: "How readers can flag an error, how quickly we respond, and how corrections are shown on published stories.",
  },
  privacy: {
    title: "Privacy policy",
    updatedAt: "2026-09-28T00:00:00Z",
    summary: "What information we collect when you read or contact us, and how we store and protect it.",
  },
  terms: {
    title: "Terms of use",
    updatedAt: "2026-08-15T00:00:00Z",
    summary: "The rules for using Pulse, including reuse of our content.",
  },
  cookies: {
    title: "Cookie policy",
    updatedAt: "2026-08-15T00:00:00Z",
    summary: "Which cookies we use, why we use them, and how you can control them.",
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) return { title: "Policy not found", robots: { index: false, follow: false } };
  return { title: policy.title, description: policy.summary };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <p className={kicker}>Policies</p>
      <h1 className="mt-4 font-serif text-5xl leading-tight font-bold text-ink">{policy.title}</h1>
      <p className="mt-4 text-sm text-muted">
        Last updated <time dateTime={policy.updatedAt}>{formatLongDate(policy.updatedAt)}</time>
      </p>
      <p className="mt-8 text-lg leading-8 text-ink">{policy.summary}</p>
      <ToastMessage tone="warning" className="mt-8">
        Draft content for review.
      </ToastMessage>
    </div>
  );
}
