"use client";

import { clsx } from "clsx";
import { useRef, useState, type KeyboardEvent } from "react";
import { CompareHistoryRow } from "@/components/elections/compare-history-row";
import { CompareTable } from "@/components/elections/compare-table";
import {
  CHAMBERS,
  CHAMBER_NAMES,
  ELECTION_BY_YEAR,
  ELECTION_INDEX,
  PARTY_RESULT_YEARS,
  getRecord,
} from "@/lib/elections/data";
import type { ChamberKey } from "@/lib/elections/types";
import { focusRing } from "@/lib/ui";

type Preset = "l3" | "l5" | "mid" | "pres" | "custom";

type CompareElectionsProps = {
  detailed: boolean;
};

const PRESETS: { value: Preset; label: string }[] = [
  { value: "l3", label: "Latest 3" },
  { value: "l5", label: "Latest 5" },
  { value: "mid", label: "Midterms only" },
  { value: "pres", label: "Presidential years" },
  { value: "custom", label: "Custom years" },
];

const TAB_LABELS: Record<ChamberKey, string> = {
  senate: "Senate",
  house: "House",
  gov: "Governors",
};

const chipClass = (pressed: boolean) =>
  clsx(
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold motion-safe:transition-colors",
    pressed ? "border-ink bg-ink text-paper" : "border-border bg-paper text-ink hover:border-ink",
    focusRing,
  );

/** Compare 2 to 5 elections for one chamber: a stacked history list and a numbers table. */
export function CompareElections({ detailed }: CompareElectionsProps) {
  const [preset, setPreset] = useState<Preset>("l3");
  const [chamber, setChamber] = useState<ChamberKey>("senate");
  const [custom, setCustom] = useState<number[]>([2016, 2020, 2024, 2026]);
  const [hint, setHint] = useState("");
  const tabRefs = useRef<Record<ChamberKey, HTMLButtonElement | null>>({
    senate: null,
    house: null,
    gov: null,
  });

  const available = PARTY_RESULT_YEARS.filter((year) => getRecord(chamber, year));
  const byType = (type: "mid" | "pres") =>
    available.filter((year) => ELECTION_BY_YEAR[year]?.type === type).slice(-5);
  const selectedYears = (
    preset === "l3"
      ? available.slice(-3)
      : preset === "l5"
        ? available.slice(-5)
        : preset === "mid"
          ? byType("mid")
          : preset === "pres"
            ? byType("pres")
            : custom.filter((year) => available.includes(year))
  ).sort((a, b) => a - b);

  function toggleYear(year: number) {
    if (custom.includes(year)) {
      if (custom.length <= 2) {
        setHint("Keep at least two elections selected.");
        return;
      }
      setCustom(custom.filter((value) => value !== year));
    } else {
      if (custom.length >= 5) {
        setHint("Up to five elections at a time. Remove one first.");
        return;
      }
      setCustom([...custom, year].sort((a, b) => a - b));
    }
    setHint("");
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = CHAMBERS.indexOf(chamber);
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % CHAMBERS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + CHAMBERS.length) % CHAMBERS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = CHAMBERS.length - 1;
    if (next === null) return;
    event.preventDefault();
    const target = CHAMBERS[next];
    if (!target) return;
    setChamber(target);
    tabRefs.current[target]?.focus();
  }

  const customChoices = ELECTION_INDEX.map((entry) => entry.year).filter((year) =>
    getRecord(chamber, year),
  );

  return (
    <section aria-labelledby="compare-title" className="flex flex-col gap-6">
      <div>
        <h2 id="compare-title" className="font-serif text-3xl font-bold text-ink">
          Compare elections
        </h2>
        <p className="mt-2 text-base leading-7 text-muted">
          Choose a set of elections, then a chamber.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p
            id="preset-label"
            className="mb-2 text-xs font-bold tracking-[0.08em] text-muted uppercase"
          >
            Elections
          </p>
          <div role="group" aria-labelledby="preset-label" className="flex flex-wrap gap-2">
            {PRESETS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={preset === option.value}
                onClick={() => setPreset(option.value)}
                className={chipClass(preset === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p
            id="chamber-label"
            className="mb-2 text-xs font-bold tracking-[0.08em] text-muted uppercase"
          >
            Chamber
          </p>
          <div
            role="tablist"
            aria-labelledby="chamber-label"
            className="inline-flex rounded-md border border-border bg-surface p-1"
          >
            {CHAMBERS.map((key) => {
              const selected = key === chamber;
              return (
                <button
                  key={key}
                  ref={(node) => {
                    tabRefs.current[key] = node;
                  }}
                  id={`compare-tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="compare-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setChamber(key)}
                  onKeyDown={onTabKeyDown}
                  className={clsx(
                    "rounded px-4 py-2 text-sm font-semibold",
                    selected ? "bg-paper text-primary shadow-sm" : "text-muted hover:text-ink",
                    focusRing,
                  )}
                >
                  {TAB_LABELS[key]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {preset === "custom" ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <p id="custom-label" className="text-xs font-bold tracking-[0.08em] text-muted uppercase">
            Pick 2 to 5 elections
          </p>
          <div
            role="group"
            aria-labelledby="custom-label"
            className="flex max-h-44 flex-wrap gap-2 overflow-y-auto p-1"
          >
            {customChoices.map((year) => {
              const provisional = getRecord(chamber, year)?.status === "provisional";
              return (
                <button
                  key={year}
                  type="button"
                  aria-pressed={custom.includes(year)}
                  onClick={() => toggleYear(year)}
                  className={chipClass(custom.includes(year))}
                >
                  {ELECTION_BY_YEAR[year]?.label ?? year}
                  {provisional ? (
                    <span className="rounded bg-provisional-soft px-1 text-[10px] font-bold text-provisional uppercase">
                      Provisional
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="min-h-5 text-sm font-medium text-provisional">
            {hint}
          </p>
        </div>
      ) : null}

      <div
        id="compare-panel"
        role="tabpanel"
        aria-labelledby={`compare-tab-${chamber}`}
        className="flex flex-col gap-6"
      >
        {selectedYears.length < 2 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-muted">
            Pick at least two elections with {CHAMBER_NAMES[chamber]} records.
          </p>
        ) : (
          <>
            <ol
              aria-live="polite"
              className="rounded-lg border border-border bg-paper px-4 sm:px-5"
            >
              {selectedYears.map((year, index) => {
                const record = getRecord(chamber, year);
                if (!record) return null;
                const previousYear = selectedYears[index - 1];
                return (
                  <CompareHistoryRow
                    key={year}
                    chamber={chamber}
                    year={year}
                    record={record}
                    previous={
                      previousYear !== undefined ? getRecord(chamber, previousYear) : undefined
                    }
                    detailed={detailed}
                  />
                );
              })}
            </ol>
            <CompareTable chamber={chamber} years={selectedYears} detailed={detailed} />
          </>
        )}
      </div>
    </section>
  );
}
