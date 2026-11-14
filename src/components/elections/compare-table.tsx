import { clsx } from "clsx";
import {
  CHAMBER_NAMES,
  formatChange,
  getRecord,
  isSamePartyPair,
  partyLabel,
  seats,
} from "@/lib/elections/data";
import type { ChamberKey, ElectionRecord } from "@/lib/elections/types";

type CompareTableProps = {
  chamber: ChamberKey;
  years: number[];
  detailed: boolean;
};

type Row = {
  key: string;
  label: string;
  labelClass?: string;
  cells: {
    value: string | number;
    sub?: string;
    fraction?: number;
    barClass?: string;
    small?: boolean;
  }[];
  change: { text: string; className?: string };
  separator?: boolean;
};

/** Side-by-side numbers for the selected elections with the net change from first to last. */
export function CompareTable({ chamber, years, detailed }: CompareTableProps) {
  const records = years
    .map((year) => getRecord(chamber, year))
    .filter((r): r is ElectionRecord => Boolean(r));
  const first = records[0];
  const last = records[records.length - 1];
  if (!first || !last || records.length !== years.length) return null;

  const labelsSame = records.every((record) => isSamePartyPair(first, record));
  const sameSize = first.total === last.total;
  const canDiff = labelsSame && sameSize;
  const startYear = years[0];
  const endYear = years[years.length - 1];

  const diff = (pick: (record: ElectionRecord) => number, party?: "D" | "R" | "U") => {
    if (!canDiff) return { text: "n/a" };
    if (party === "U") return { text: "—" };
    const delta = pick(last) - pick(first);
    const className =
      delta === 0 ? undefined : party === "D" ? "text-dem" : party === "R" ? "text-rep" : undefined;
    const uncalledFirst = seats(first, "U");
    const uncalledLast = seats(last, "U");
    if (party && (uncalledFirst || uncalledLast)) {
      return {
        text: `${formatChange(delta - uncalledFirst)} to ${formatChange(delta + uncalledLast)}*`,
        className,
      };
    }
    return { text: formatChange(delta), className };
  };

  const rows: Row[] = [];
  for (const party of ["D", "R"] as const) {
    rows.push({
      key: party,
      label: labelsSame
        ? partyLabel(first, party)
        : `Historical party group ${party === "D" ? "1" : "2"}`,
      labelClass: party === "D" ? "text-dem" : "text-rep",
      cells: records.map((record) => ({
        value: seats(record, party),
        sub: labelsSame ? undefined : partyLabel(record, party),
        fraction: seats(record, party) / record.total,
        barClass: party === "D" ? "bg-dem-bar" : "bg-rep-bar",
      })),
      change: diff((record) => seats(record, party), party),
    });
  }

  const others = (record: ElectionRecord) => seats(record, "I") + seats(record, "O");
  if (records.some(others)) {
    rows.push({
      key: "other",
      label: "Other / independent / vacancy",
      cells: records.map((record) => ({ value: others(record) })),
      change: diff(others),
    });
  }

  const uncalled = (record: ElectionRecord) => seats(record, "U");
  if (records.some(uncalled)) {
    rows.push({
      key: "uncalled",
      label: "Uncalled",
      cells: records.map((record) => ({ value: uncalled(record) })),
      change: diff(uncalled, "U"),
    });
  }

  if (chamber !== "gov") {
    const controlName = (record: ElectionRecord) =>
      record.control === "N" || !record.control
        ? "No single-party majority"
        : partyLabel(record, record.control);
    rows.push({
      key: "control",
      label: "Leading party / control",
      cells: records.map((record) => ({ value: controlName(record) })),
      change: {
        text: canDiff
          ? controlName(first) === controlName(last)
            ? "No change"
            : `To ${controlName(last)}`
          : "Not comparable",
      },
      separator: true,
    });
  }

  if (detailed) {
    rows.push({
      key: "size",
      label: chamber === "gov" ? "States" : "Seats in chamber",
      cells: records.map((record) => ({ value: record.total })),
      change: { text: sameSize ? "0" : "Different sizes" },
      separator: true,
    });
    rows.push({
      key: "asof",
      label: "Snapshot date",
      cells: records.map((record) => ({ value: record.asOf ?? "—", small: true })),
      change: { text: "—" },
    });
  }

  const notes = [
    "What these numbers represent: party composition following each selected election, not the number of individual races won. Net differences are changes between snapshots, not verified seat flips.",
  ];
  if (!labelsSame) {
    notes.push(
      "Party names change across history. The first and second groups are NOT treated as today's Democrats and Republicans; numerical differences across party systems are suppressed.",
    );
  }
  if (!sameSize)
    notes.push("The chamber or state total changed, so seat differences are suppressed.");
  if (chamber === "gov") {
    notes.push(
      "Historical governors use the National Governors Association's following-year annual count, which may also reflect appointments or other non-election changes.",
    );
  }
  if (records.some((record) => record.status === "provisional")) {
    notes.push("* 2026 is a dated provisional snapshot, not a certified result.");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
          <caption className="sr-only">{CHAMBER_NAMES[chamber]} comparison</caption>
          <thead className="bg-surface">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold text-ink">
                {CHAMBER_NAMES[chamber]}
              </th>
              {years.map((year, index) => (
                <th key={year} scope="col" className="px-4 py-3 font-semibold text-ink">
                  {year}
                  {records[index]?.status === "provisional" ? (
                    <span className="text-provisional">*</span>
                  ) : null}
                </th>
              ))}
              <th scope="col" className="border-l border-border px-4 py-3 font-semibold text-ink">
                Change
                <br />
                <span className="text-xs font-medium text-muted">
                  {startYear} → {endYear}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={clsx("border-t", row.separator ? "border-ink/30" : "border-border")}
              >
                <th
                  scope="row"
                  className={clsx("px-4 py-3 font-semibold", row.labelClass ?? "text-ink")}
                >
                  {row.label}
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={years[index]}
                    className={clsx(
                      "px-4 py-3 align-top",
                      cell.small ? "max-w-60 text-xs text-muted" : "text-ink",
                    )}
                  >
                    {cell.value}
                    {cell.sub ? (
                      <span className="block text-[10px] font-medium text-muted">{cell.sub}</span>
                    ) : null}
                    {cell.fraction !== undefined ? (
                      <span
                        aria-hidden="true"
                        className={clsx("mt-1 block h-1 rounded-full", cell.barClass)}
                        style={{ width: `${Math.max(4, cell.fraction * 100).toFixed(1)}%` }}
                      />
                    ) : null}
                  </td>
                ))}
                <td
                  className={clsx(
                    "border-l border-border px-4 py-3 font-semibold",
                    row.change.className ?? "text-ink",
                  )}
                >
                  {row.change.text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-1.5 text-xs leading-5 text-muted">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
