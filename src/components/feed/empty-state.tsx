import { clsx } from "clsx";
import { Inbox, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonPrimary } from "@/lib/ui";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { href: string; label: string };
  headingLevel?: "h2" | "h3";
  className?: string;
};

/** Designed empty state: dashed border, small icon, a short line, and an optional button. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  headingLevel = "h2",
  className,
}: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-6 text-primary" />
      <Heading className="font-serif text-xl font-semibold text-ink">{title}</Heading>
      {description ? <p className="max-w-md text-sm leading-6 text-muted">{description}</p> : null}
      {action ? (
        <Link href={action.href} className={clsx(buttonPrimary, "mt-2")}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
