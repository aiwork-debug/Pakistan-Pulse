import { clsx } from "clsx";
import { ExternalLink } from "lucide-react";
import { RETRIEVED, SOURCES, count, getRecord, majorityOf, seats } from "@/lib/elections/data";
import type { ChamberKey } from "@/lib/elections/types";
import { formatShortDate } from "@/lib/format";
import { focusRing } from "@/lib/ui";

type ChamberDetailsProps = {
  chamber: ChamberKey;
  year: number;
};

const PARTY_NAMES = { D: "Democrats", R: "Republicans" } as const;

const TIER_TONES = {
  official: "bg-primary/10 text-primary",
  reference: "border border-border bg-surface text-muted",
  news: "bg-provisional-soft text-provisional",
} as const;

/** Detailed view for one chamber and year: status, seats elected, flips, uncalled races, count history and sources. */
export function ChamberDetails({ chamber, year }: ChamberDetailsProps) {
  const record = getRecord(chamber, year);
  if (!record) return null;

  const rows: [string, string][] = [];
  rows.push([
    "Status",
    record.status === "provisional"
      ? "Provisional (race calls)"
      : record.status === "historical"
        ? "Historical record"
        : "Final record",
  ]);
  if (record.asOf) rows.push(["Counted as of", record.asOf]);
  if (record.chosen) rows.push(["How chosen", record.chosen]);
  if (record.contested) {
    rows.push([
      chamber === "gov" ? "Races held" : "Seats elected",
      chamber === "house" ? `All ${record.contested}` : String(record.contested),
    ]);
  }
  if (record.won) {
    const won = record.won;
    rows.push([
      "Races won",
      [
        won.D !== undefined ? `D ${won.D}` : "",
        won.I ? `Ind ${won.I}` : "",
        won.R !== undefined ? `R ${won.R}` : "",
        won.U ? `${won.U} uncalled` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
  }
  if (record.flips) {
    const prefix = record.flips.atLeast ? "at least " : "";
    rows.push([
      "Seats that changed party",
      `${prefix}${record.flips.toD} to D · ${prefix}${record.flips.toR} to R`,
    ]);
  }
  if (seats(record, "I")) {
    rows.push([
      "Independents",
      chamber === "gov"
        ? String(seats(record, "I"))
        : `${seats(record, "I")}, caucus with Democrats (counted as independents)`,
    ]);
  }
  if (seats(record, "O"))
    rows.push([
      "Other parties",
      `${seats(record, "O")}${record.oLabel ? `: ${record.oLabel}` : ""}`,
    ]);
  if (chamber !== "gov")
    rows.push(["Chamber size", `${record.total} seats · ${majorityOf(record)} for a majority`]);

  const showIndependents = record.snapshots?.some((snapshot) => snapshot.I) ?? false;
  const headingClass = "mt-5 mb-2 text-xs font-bold tracking-[0.08em] text-muted uppercase";

  return (
    <div className="border-t border-border pt-4 text-sm leading-6">
      <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-4 gap-y-1.5">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="font-semibold text-muted">{term}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {record.flips?.list ? <p className="mt-3 text-muted">{record.flips.list}.</p> : null}

      {record.outstanding ? (
        <>
          <h4 className={headingClass}>Uncalled</h4>
          <ul className="flex flex-col gap-1.5">
            {record.outstanding.map((race) => (
              <li key={race.state}>
                <span className="font-semibold text-ink">{race.state}</span>{" "}
                <span className="text-muted">
                  (held by {PARTY_NAMES[race.held]} before): {race.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {record.projection ? (
        <>
          <h4 className={headingClass}>Projection, not a result</h4>
          <p className="text-muted">
            {record.projection.by} Estimate: {record.projection.D} D, {record.projection.R} R.
          </p>
        </>
      ) : null}

      {record.snapshots ? (
        <>
          <h4 className={headingClass}>Count history</h4>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-xs tabular-nums">
              <caption className="sr-only">Count history for {year}</caption>
              <thead className="bg-surface text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    When · source
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    D
                  </th>
                  {showIndependents ? (
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Ind
                    </th>
                  ) : null}
                  <th scope="col" className="px-3 py-2 font-semibold">
                    R
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Uncalled
                  </th>
                </tr>
              </thead>
              <tbody>
                {record.snapshots.map((snapshot) => (
                  <tr key={`${snapshot.when}-${snapshot.by}`} className="border-t border-border">
                    <td className="px-3 py-2 text-muted">
                      {snapshot.when} · {snapshot.by}
                    </td>
                    <td className="px-3 py-2 font-semibold text-dem">{snapshot.D}</td>
                    {showIndependents ? (
                      <td className="px-3 py-2">{count(snapshot, "I")}</td>
                    ) : null}
                    <td className="px-3 py-2 font-semibold text-rep">{snapshot.R}</td>
                    <td className="px-3 py-2">{count(snapshot, "U")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {record.note ? <p className="mt-3 text-muted">{record.note}</p> : null}

      <h4 className={headingClass}>Sources</h4>
      <ol className="flex flex-col gap-2">
        {record.src.map((key) => {
          const source = SOURCES[key];
          if (!source) return null;
          return (
            <li key={key} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className={clsx(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                  TIER_TONES[source.tier],
                )}
              >
                {source.tier}
              </span>
              <span className="text-muted">{source.org}:</span>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  "inline-flex items-center gap-1 rounded-sm font-semibold text-primary underline-offset-4 hover:underline",
                  focusRing,
                )}
              >
                {source.title}
                <ExternalLink aria-hidden="true" className="size-3" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <span className="text-xs text-muted">
                retrieved <time dateTime={RETRIEVED}>{formatShortDate(RETRIEVED)}</time>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
