"use client";

import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusPill, type StatusTone } from "@/components/elections/status-pill";
import { YearSnapshotCard } from "@/components/elections/year-snapshot-card";
import {
  CHAMBERS,
  ELECTION_BY_YEAR,
  ELECTION_INDEX,
  INDEX_SOURCE,
  LATEST_YEAR,
  coverageOf,
  electionTypeLabel,
  getRecord,
} from "@/lib/elections/data";
import type { ElectionType } from "@/lib/elections/types";
import { focusRing, inputBase, textLink } from "@/lib/ui";

type TypeFilter = "all" | ElectionType;

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All elections" },
  { value: "pres", label: "Presidential years" },
  { value: "mid", label: "Midterms only" },
];

const FULLY_LOADED = ELECTION_INDEX.filter((entry) => coverageOf(entry.year) === 3).length;
const PARTLY_LOADED = ELECTION_INDEX.filter((entry) => {
  const coverage = coverageOf(entry.year);
  return coverage > 0 && coverage < 3;
}).length;

const pillClass = (pressed: boolean) =>
  clsx(
    "rounded-full border px-3.5 py-2 text-xs font-semibold motion-safe:transition-colors",
    pressed ? "border-ink bg-ink text-paper" : "border-border bg-paper text-ink hover:border-ink",
    focusRing,
  );

/** Simplest view: pick any federal election year since 1788 and see Senate, House and governor totals. */
export function YearExplorer() {
  const [year, setYear] = useState(LATEST_YEAR);
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [completeOnly, setCompleteOnly] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const years = useMemo(
    () =>
      ELECTION_INDEX.filter(
        (entry) =>
          (filter === "all" || entry.type === filter) &&
          (!completeOnly || coverageOf(entry.year) === 3),
      ).map((entry) => entry.year),
    [filter, completeOnly],
  );

  // Keep the selection inside the filtered list.
  const selected = years.includes(year) ? year : (years[0] ?? year);
  const position = years.indexOf(selected);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!scroller || !active) return;
    scroller.scrollTo({
      left:
        active.offsetLeft - scroller.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [selected, years]);

  const entry = ELECTION_BY_YEAR[selected];
  const coverage = coverageOf(selected);
  const provisional = CHAMBERS.some(
    (chamber) => getRecord(chamber, selected)?.status === "provisional",
  );
  const status: { tone: StatusTone; label: string } =
    coverage === 0
      ? { tone: "pending", label: "Party results pending" }
      : provisional
        ? { tone: "provisional", label: "Provisional snapshot" }
        : { tone: "historical", label: "Historical results" };

  const note =
    coverage === 0
      ? "This is a historical election-year entry, not a published result. No party seat totals have been added for this selected year."
      : provisional
        ? "Party totals are a provisional 2026 snapshot, not certified final results. Senate caucus counts include aligned independents."
        : `These are party compositions after the selected federal election, not the number of individual races won. Congress data: compiled official historical party-division tables; governors: NGA annual counts (where available).${selected < 1856 ? " Party names are historical, not modern Democrats and Republicans." : ""}`;

  function step(direction: -1 | 1) {
    const next = years[position + direction];
    if (next !== undefined) setYear(next);
  }

  return (
    <section aria-labelledby="year-title" className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            Total party representation · historical snapshot
          </p>
          <h2
            id="year-title"
            className="mt-2 font-serif text-3xl font-bold text-ink sm:text-4xl"
            aria-live="polite"
          >
            {entry
              ? `${entry.label} ${entry.type === "mid" ? "Midterm" : "Presidential-Year"} Election`
              : "No election"}
          </h2>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>

      {years.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-muted">
          No elections match this filter.
        </p>
      ) : (
        <>
          {coverage < 3 ? (
            <div
              role="status"
              className="rounded-lg border border-border bg-paper px-4 py-3 text-sm leading-6 text-muted"
            >
              {coverage === 0 ? (
                <>
                  <strong className="text-ink">
                    {entry?.label} is in the US election calendar.
                  </strong>{" "}
                  This election year has no seat totals in the linked historical compilation. Data
                  will be added only after source review.{" "}
                  <a
                    href={INDEX_SOURCE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={textLink}
                  >
                    See the year index
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  .
                </>
              ) : (
                `${entry?.label} currently has party seat totals for ${coverage} of 3 categories. Missing categories are labelled "Party totals not yet loaded".`
              )}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            {CHAMBERS.map((chamber) => (
              <YearSnapshotCard key={chamber} chamber={chamber} year={selected} />
            ))}
          </div>
          <p className="text-xs leading-5 text-muted">{note}</p>
        </>
      )}

      <nav
        aria-label="Select an election year"
        className="flex flex-col gap-4 rounded-xl bg-surface p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-ink">Choose an election year</h3>
          <label className="w-full sm:w-auto">
            <span className="sr-only">Jump to an election year</span>
            <select
              value={selected}
              onChange={(event) => setYear(Number(event.target.value))}
              className={clsx(inputBase, "h-11 border-border font-semibold sm:w-72")}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {ELECTION_BY_YEAR[y]?.label} · {electionTypeLabel(y)} ·{" "}
                  {coverageOf(y) ? "Totals loaded" : "Pending"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={position <= 0}
            aria-label="Select newer election"
            className={clsx(
              "flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-paper text-ink hover:border-ink disabled:cursor-default disabled:opacity-35",
              focusRing,
            )}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <div
            ref={scrollerRef}
            role="group"
            aria-label="Federal election years; seat-result availability is shown beneath each year"
            className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto overscroll-x-contain rounded-lg bg-paper p-2"
          >
            {years.map((y) => {
              const loaded = coverageOf(y);
              const availability =
                loaded === 3 ? "Totals loaded" : loaded ? "Partial totals" : "Totals pending";
              const pressed = y === selected;
              return (
                <button
                  key={y}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={`Show ${ELECTION_BY_YEAR[y]?.label} ${electionTypeLabel(y)} election; ${availability}`}
                  onClick={() => setYear(y)}
                  className={clsx(
                    "flex min-w-28 shrink-0 snap-center flex-col items-center gap-0.5 rounded-md px-4 py-2.5",
                    pressed ? "bg-ink text-paper" : "text-muted hover:bg-surface hover:text-ink",
                    !pressed && loaded === 0 && "opacity-75",
                    focusRing,
                  )}
                >
                  <span className="text-2xl leading-tight font-extrabold tabular-nums">
                    {ELECTION_BY_YEAR[y]?.label}
                  </span>
                  <span className="text-[10px] font-bold tracking-wide uppercase">
                    {electionTypeLabel(y)}
                  </span>
                  <span className="text-[10px] font-semibold opacity-80">
                    {loaded === 3 ? "● " : loaded ? "◐ " : "○ "}
                    {availability}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={position === -1 || position >= years.length - 1}
            aria-label="Select older election"
            className={clsx(
              "flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-paper text-ink hover:border-ink disabled:cursor-default disabled:opacity-35",
              focusRing,
            )}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div
          role="group"
          aria-label="Filter election years"
          className="flex flex-wrap justify-center gap-2"
        >
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={pillClass(filter === option.value)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={completeOnly}
            onClick={() => setCompleteOnly((value) => !value)}
            className={clsx(pillClass(completeOnly), !completeOnly && "border-dashed")}
          >
            Only complete years (3 results)
          </button>
        </div>

        <p className="text-center text-xs font-semibold text-muted">
          {ELECTION_INDEX.length} federal cycles indexed · {FULLY_LOADED} with all 3 seat totals
          loaded · {PARTLY_LOADED} partially loaded · years before 1900 have no governor totals
        </p>
      </nav>
    </section>
  );
}
