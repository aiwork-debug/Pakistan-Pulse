import { clsx } from "clsx";
import { ChangeChips } from "@/components/elections/change-chips";
import { SeatBar } from "@/components/elections/seat-bar";
import { electionTypeLabel, isSamePartyPair, partyLabel, seats } from "@/lib/elections/data";
import type { ChamberKey, ElectionRecord } from "@/lib/elections/types";

type CompareHistoryRowProps = {
  chamber: ChamberKey;
  year: number;
  record: ElectionRecord;
  previous?: ElectionRecord;
  detailed: boolean;
};

/** One election in the compare list: year, both sides' seats, a thin bar, and who leads. */
export function CompareHistoryRow({
  chamber,
  year,
  record,
  previous,
  detailed,
}: CompareHistoryRowProps) {
  const d = seats(record, "D");
  const r = seats(record, "R");
  const historic = Boolean(record.historicalNames);

  let control: { label: string; tone: string };
  if (chamber === "gov") {
    control =
      d > r
        ? { label: "More Dem", tone: "dem" }
        : r > d
          ? { label: "More Rep", tone: "rep" }
          : { label: "Even", tone: "n" };
  } else {
    const changed =
      previous !== undefined &&
      isSamePartyPair(record, previous) &&
      previous.control !== record.control;
    const label =
      record.control === "N" || !record.control
        ? "No party majority"
        : `${partyLabel(record, record.control)} lead`;
    control = {
      label: changed ? `${label} · changed` : label,
      tone: record.control === "D" ? "dem" : record.control === "R" ? "rep" : "n",
    };
  }

  const middle = [
    seats(record, "I") ? `${seats(record, "I")} independent` : "",
    seats(record, "O") ? `${seats(record, "O")} other / vacancy` : "",
    seats(record, "U") ? `${seats(record, "U")} uncalled` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const statusText =
    record.status === "provisional"
      ? "Provisional"
      : record.status === "historical"
        ? "Historical"
        : `${electionTypeLabel(year)} year`;

  return (
    <li className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 border-t border-border py-4 first:border-t-0 md:grid-cols-[5rem_6rem_minmax(0,1fr)_6rem_12rem] md:items-center">
      <div className="row-span-2 md:row-span-1">
        <p className="text-2xl font-extrabold text-ink tabular-nums">{year}</p>
        <p
          className={clsx(
            "text-[10px] font-bold tracking-wide uppercase",
            record.status === "provisional" ? "text-provisional" : "text-muted",
          )}
        >
          {statusText}
        </p>
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:contents">
        <p
          className={clsx(
            "text-right tabular-nums md:order-none",
            historic ? "text-hist-a" : "text-dem",
          )}
        >
          <span className="block text-2xl font-black">{d}</span>
          <span className="block text-[10px] leading-tight font-bold text-muted">
            {partyLabel(record, "D")}
          </span>
        </p>
        <div className="min-w-0">
          <SeatBar chamber={chamber} record={record} size="thin" historic={historic} />
          {middle ? <p className="mt-1 text-center text-xs text-muted">{middle}</p> : null}
        </div>
        <p className={clsx("tabular-nums", historic ? "text-hist-b" : "text-rep")}>
          <span className="block text-2xl font-black">{r}</span>
          <span className="block text-[10px] leading-tight font-bold text-muted">
            {partyLabel(record, "R")}
          </span>
        </p>
      </div>

      <div className="col-start-2 flex flex-col gap-1.5 md:col-start-auto">
        <span
          className={clsx(
            "w-fit rounded px-2 py-0.5 text-xs font-bold",
            control.tone === "dem" && "bg-dem-soft text-dem",
            control.tone === "rep" && "bg-rep-soft text-rep",
            control.tone === "n" && "border border-border bg-surface text-muted",
          )}
        >
          {control.label}
        </span>
        {record.historicalCompiled || record.governorAnnualSnapshot ? (
          <span className="text-xs text-muted">Composition snapshot · not election flips</span>
        ) : (
          <ChangeChips chamber={chamber} year={year} compact />
        )}
      </div>

      {detailed ? (
        <p className="col-start-2 text-xs leading-5 text-muted md:col-span-4 md:col-start-2">
          {record.asOf}
          {record.historicalNames ? ` · Party names reflect ${record.comparisonEra}` : ""}
        </p>
      ) : null}
    </li>
  );
}
