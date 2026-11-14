import { clsx } from "clsx";
import { CHAMBER_NAMES, majorityOf, partyLabel, seats } from "@/lib/elections/data";
import type { ChamberKey, ElectionRecord } from "@/lib/elections/types";

type SeatBarProps = {
  chamber: ChamberKey;
  record: ElectionRecord;
  size?: "lg" | "md" | "thin";
  /** Use neutral colours for party systems that are not today's Democrats and Republicans. */
  historic?: boolean;
  showMajority?: boolean;
};

const HEIGHTS = { lg: "h-7", md: "h-5", thin: "h-3" } as const;

/** Horizontal seat bar: Democrats from the left, Republicans from the right, others and uncalled in between. */
export function SeatBar({
  chamber,
  record,
  size = "md",
  historic = false,
  showMajority = true,
}: SeatBarProps) {
  const total = record.total;
  const segments = [
    {
      key: "D",
      value: seats(record, "D"),
      label: partyLabel(record, "D"),
      className: historic ? "bg-hist-a" : "bg-dem-bar",
    },
    {
      key: "I",
      value: seats(record, "I"),
      label: chamber === "gov" ? "Independents" : "Independents caucusing with Democrats",
      className:
        chamber === "gov"
          ? "bg-other-bar"
          : "bg-other-bar bg-[linear-gradient(90deg,var(--color-dem-bar)_0_3px,transparent_3px)]",
    },
    {
      key: "O",
      value: seats(record, "O"),
      label: record.oLabel ?? "Other",
      className: "bg-other-bar",
    },
    {
      key: "U",
      value: seats(record, "U"),
      label: "Uncalled",
      className:
        "bg-[repeating-linear-gradient(135deg,var(--color-uncalled)_0_4px,var(--color-paper)_4px_7px)]",
    },
    {
      key: "R",
      value: seats(record, "R"),
      label: partyLabel(record, "R"),
      className: historic ? "bg-hist-b" : "bg-rep-bar",
    },
  ].filter((segment) => segment.value > 0);

  const withMajority = showMajority && chamber !== "gov";
  const majority = majorityOf(record);
  const position = (majority / total) * 100;
  const labelled = withMajority && size !== "thin";
  const description = `${CHAMBER_NAMES[chamber]}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")} of ${total} seats`;

  return (
    <div className={clsx("relative", labelled && "pt-6")}>
      {labelled ? (
        <span
          className="absolute top-0 -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-muted"
          style={{ left: `${position}%` }}
        >
          {majority} for majority
        </span>
      ) : null}
      <div
        role="img"
        aria-label={description}
        className={clsx("flex w-full overflow-hidden rounded bg-border", HEIGHTS[size])}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={clsx("block h-full", segment.className)}
            style={{ width: `${((segment.value / total) * 100).toFixed(3)}%` }}
          />
        ))}
      </div>
      {withMajority ? (
        <span
          aria-hidden="true"
          className={clsx(
            "absolute -bottom-1 w-0.5 -translate-x-1/2 bg-ink",
            labelled ? "top-5" : "-top-1",
          )}
          style={{ left: `${position}%` }}
        />
      ) : null}
    </div>
  );
}
