import { clsx } from "clsx";
import { changeLabel, formatChange, getRecord, seatChange, seats } from "@/lib/elections/data";
import type { ChamberKey } from "@/lib/elections/types";

type ChangeChipsProps = {
  chamber: ChamberKey;
  year: number;
  compact?: boolean;
};

const chipBase = "inline-flex items-center rounded px-2 py-0.5 text-xs font-bold tabular-nums";

const TONES = {
  D: "bg-dem-soft text-dem",
  R: "bg-rep-soft text-rep",
  neutral: "border border-border bg-surface text-muted",
  pending: "bg-provisional-soft text-provisional",
} as const;

function arrow(value: number): string {
  if (value > 0) return "▲ ";
  if (value < 0) return "▼ ";
  return "";
}

/** Gains and losses for one chamber in one election, or a short note when they cannot be established. */
export function ChangeChips({ chamber, year, compact = false }: ChangeChipsProps) {
  const record = getRecord(chamber, year);
  if (!record) return null;
  const change = seatChange(chamber, year);

  if (!change) {
    if (record.changeNA) {
      return compact ? (
        <span className="text-xs text-muted">Change not comparable</span>
      ) : (
        <p className="text-sm leading-6 text-muted">{record.changeNA}</p>
      );
    }
    if (record.status === "provisional")
      return <span className={clsx(chipBase, TONES.pending)}>Counting continues</span>;
    return null;
  }

  const uncalled = seats(record, "U");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {compact ? null : (
        <span className="w-full text-xs font-semibold text-muted">
          {changeLabel(chamber, year, change)}
          {change.atLeast ? " (net of seats called; more may follow)" : ""}
        </span>
      )}
      <span className={clsx(chipBase, change.D === 0 ? TONES.neutral : TONES.D)}>
        Dem {arrow(change.D)}
        {formatChange(change.D)}
      </span>
      <span className={clsx(chipBase, change.R === 0 ? TONES.neutral : TONES.R)}>
        Rep {arrow(change.R)}
        {formatChange(change.R)}
      </span>
      {change.I ? (
        <span className={clsx(chipBase, TONES.neutral)}>Ind {formatChange(change.I)}</span>
      ) : null}
      {change.O ? (
        <span className={clsx(chipBase, TONES.neutral)}>Other {formatChange(change.O)}</span>
      ) : null}
      {uncalled && record.status === "provisional" ? (
        <span className={clsx(chipBase, TONES.pending)}>{uncalled} uncalled</span>
      ) : null}
    </div>
  );
}
