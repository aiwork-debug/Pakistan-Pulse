import { clsx } from "clsx";
import type { PostStatus, ProfileStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: ProfileStatus | PostStatus;
};

const LABELS: Record<ProfileStatus | PostStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
  PUBLISHED: "Published",
  DRAFT: "Draft",
};

/** Brand colors only: live states in primary, drafts outlined in ink, inactive states muted. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        (status === "ACTIVE" || status === "PUBLISHED") && "border-primary/20 bg-primary/10 text-primary",
        status === "DRAFT" && "border-ink/30 bg-paper text-ink",
        (status === "SUSPENDED" || status === "ARCHIVED") && "border-border bg-surface text-ink",
      )}
    >
      {LABELS[status]}
    </span>
  );
}
