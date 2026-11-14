import { clsx } from "clsx";
import type { ReactNode } from "react";

export type StatusTone = "provisional" | "final" | "historical" | "pending";

type StatusPillProps = {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
};

const TONES: Record<StatusTone, string> = {
  provisional: "bg-provisional-soft text-provisional",
  final: "bg-primary/10 text-primary",
  historical: "bg-primary/10 text-primary",
  pending: "border border-border bg-surface text-muted",
};

/** Small uppercase label for a record's status: provisional, final, historical or pending. */
export function StatusPill({ tone, children, className }: StatusPillProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] whitespace-nowrap uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
