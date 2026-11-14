import { clsx } from "clsx";
import { ChamberDetails } from "@/components/elections/chamber-details";
import { ChangeChips } from "@/components/elections/change-chips";
import { SeatBar } from "@/components/elections/seat-bar";
import { StatusPill } from "@/components/elections/status-pill";
import {
  CHAMBERS,
  CHAMBER_NAMES,
  LATEST_YEAR,
  getRecord,
  majorityOf,
  seats,
} from "@/lib/elections/data";
import type { ChamberKey, ElectionRecord } from "@/lib/elections/types";

type LatestResultsProps = {
  detailed: boolean;
};

function ResultLine({ chamber, record }: { chamber: ChamberKey; record: ElectionRecord }) {
  if (chamber === "gov") {
    const d = seats(record, "D");
    const r = seats(record, "R");
    return (
      <p className="text-base font-bold text-ink">
        {d > r ? (
          <>
            <span className="text-dem">Democrats</span> hold more governorships
          </>
        ) : r > d ? (
          <>
            <span className="text-rep">Republicans</span> hold more governorships
          </>
        ) : (
          "Governorships evenly split"
        )}
      </p>
    );
  }

  const who = record.control === "R" ? "R" : "D";
  const independents = seats(record, "I");
  const demSide = seats(record, "D") + independents;
  const word = record.controlWord ?? "control";
  const detail =
    record.controlWhy ??
    (chamber === "senate" && who === "D" && independents
      ? `${demSide} seats with ${independents} independents`
      : `${who === "D" ? demSide : seats(record, "R")} of ${record.total} seats`);

  return (
    <p className="text-base leading-6 font-bold text-ink">
      <span className={who === "D" ? "text-dem" : "text-rep"}>
        {who === "D" ? "Democrats" : "Republicans"}
      </span>{" "}
      {word}
      {record.status === "provisional" ? (
        <span className="font-medium text-muted"> (called by news organisations)</span>
      ) : null}
      <br />
      <span className="text-sm font-medium text-muted">{detail}</span>
    </p>
  );
}

/** The latest election's three chamber panels with big seat totals, bars, control and gains. */
export function LatestResults({ detailed }: LatestResultsProps) {
  return (
    <section aria-labelledby="latest-title" className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="latest-title" className="font-serif text-3xl font-bold text-ink">
            {LATEST_YEAR} midterm results
          </h2>
          <StatusPill tone="provisional">
            Provisional · race calls as of <time dateTime="2026-11-05">5 Nov 2026</time>
          </StatusPill>
        </div>
        <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
          Counting continues. Uncalled seats are shown in grey stripes and are not counted as gains
          or losses.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {CHAMBERS.map((chamber) => {
          const record = getRecord(chamber, LATEST_YEAR);
          if (!record) return null;
          const middle = [
            { label: "Independents", value: seats(record, "I"), tone: "text-ink" },
            { label: "Other", value: seats(record, "O"), tone: "text-ink" },
            { label: "Uncalled", value: seats(record, "U"), tone: "text-provisional" },
          ].filter((item) => item.value > 0);

          return (
            <article
              key={chamber}
              aria-labelledby={`latest-${chamber}`}
              className={clsx(
                "flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-paper p-5",
                record.status === "provisional" && "border-t-4 border-t-provisional",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id={`latest-${chamber}`} className="text-xl font-bold text-ink">
                  {CHAMBER_NAMES[chamber]}
                </h3>
                <span className="text-xs font-semibold text-muted">
                  {chamber === "gov"
                    ? "50 states"
                    : `${record.total} seats · ${majorityOf(record)} for majority`}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                <div className="text-dem">
                  <p className="text-xs font-bold tracking-wide uppercase">Democrats</p>
                  <p className="text-5xl leading-none font-black tabular-nums">
                    {seats(record, "D")}
                  </p>
                </div>
                <div className="flex gap-3 pt-4 text-center">
                  {middle.map((item) => (
                    <div key={item.label}>
                      <p
                        className={clsx(
                          "text-2xl leading-none font-extrabold tabular-nums",
                          item.tone,
                        )}
                      >
                        {item.value}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold tracking-wide text-muted uppercase">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="text-right text-rep">
                  <p className="text-xs font-bold tracking-wide uppercase">Republicans</p>
                  <p className="text-5xl leading-none font-black tabular-nums">
                    {seats(record, "R")}
                  </p>
                </div>
              </div>

              <SeatBar chamber={chamber} record={record} size="md" />
              <ResultLine chamber={chamber} record={record} />
              <ChangeChips chamber={chamber} year={LATEST_YEAR} />
              {detailed ? <ChamberDetails chamber={chamber} year={LATEST_YEAR} /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
