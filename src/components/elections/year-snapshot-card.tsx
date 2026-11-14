import { clsx } from "clsx";
import { CHAMBER_NAMES, getRecord, partyLabel, seats } from "@/lib/elections/data";
import type { ChamberKey } from "@/lib/elections/types";
import { SeatBar } from "@/components/elections/seat-bar";

type YearSnapshotCardProps = {
  chamber: ChamberKey;
  year: number;
};

/** Big-number party totals for one chamber after one election, or a "not loaded" panel. */
export function YearSnapshotCard({ chamber, year }: YearSnapshotCardProps) {
  const record = getRecord(chamber, year);
  const name = CHAMBER_NAMES[chamber];

  if (!record) {
    return (
      <article
        aria-label={`${name} data pending for ${year}`}
        className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-paper p-5"
      >
        <h3 className="text-lg font-bold text-ink">{name}</h3>
        <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-4 py-6 text-center">
          <strong className="text-base text-ink">Party totals not yet loaded</strong>
          <span className="text-xs leading-5 text-muted">
            For this year, published aggregate seat records are still awaiting review.
          </span>
        </div>
      </article>
    );
  }

  // Modern Senate caucus counts include aligned independents; compiled history keeps them as "other".
  const caucus = chamber === "senate" && !record.historicalCompiled;
  const left = seats(record, "D") + (caucus ? seats(record, "I") : 0);
  const right = seats(record, "R");
  const other = seats(record, "O") + (caucus ? 0 : seats(record, "I"));
  const uncalled = seats(record, "U");
  const historic = Boolean(record.historicalNames);
  const leftLabel = caucus && seats(record, "I") ? "Democratic caucus" : partyLabel(record, "D");
  const rightLabel = partyLabel(record, "R");

  const extra = [
    caucus && seats(record, "I")
      ? `${seats(record, "I")} caucusing independents included in Democratic caucus`
      : "",
    other
      ? `${other} other${record.historicalCompiled ? " parties / vacancies" : " / independent seats"}`
      : "",
    uncalled ? `${uncalled} uncalled or unresolved` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const period = record.historicalCompiled
    ? `${record.comparisonEra} · ${record.asOf}`
    : record.governorAnnualSnapshot
      ? record.asOf
      : null;

  return (
    <article
      aria-label={`${name} party balance in ${year}`}
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-paper p-5"
    >
      <h3 className="text-lg font-bold text-ink">{name}</h3>
      <div className="grid grid-cols-2 items-end gap-3">
        <div className={clsx("min-w-0", historic ? "text-hist-a" : "text-dem")}>
          <p className="text-xs font-bold tracking-wide break-words uppercase">{leftLabel}</p>
          <p className="text-5xl leading-none font-black tracking-tight tabular-nums sm:text-6xl">
            {left}
          </p>
        </div>
        <div className={clsx("min-w-0 text-right", historic ? "text-hist-b" : "text-rep")}>
          <p className="text-xs font-bold tracking-wide break-words uppercase">{rightLabel}</p>
          <p className="text-5xl leading-none font-black tracking-tight tabular-nums sm:text-6xl">
            {right}
          </p>
        </div>
      </div>
      <SeatBar
        chamber={chamber}
        record={record}
        size="lg"
        historic={historic}
        showMajority={false}
      />
      <p className="min-h-5 text-xs leading-5 text-muted">{extra || " "}</p>
      {period ? (
        <p className="border-t border-border pt-2 text-[11px] leading-4 text-muted">{period}</p>
      ) : null}
    </article>
  );
}
