"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { CompareElections } from "@/components/elections/compare-elections";
import { ElectionsInfo } from "@/components/elections/elections-info";
import { LatestResults } from "@/components/elections/latest-results";
import { YearExplorer } from "@/components/elections/year-explorer";
import { focusRing } from "@/lib/ui";

type ViewMode = "simplest" | "simple" | "detailed";

const VIEWS: { value: ViewMode; label: string }[] = [
  { value: "simplest", label: "Simplest view" },
  { value: "simple", label: "Simple view" },
  { value: "detailed", label: "Detailed view" },
];

const HINTS: Record<ViewMode, string> = {
  simplest: "Pick any election year since 1788 to see the party balance.",
  simple: "Latest results and comparisons between elections.",
  detailed: "Adds seats contested, flips, independents, outstanding races and sources.",
};

/** Balance of Power: switch between the year explorer and the latest-results and compare views. */
export function ElectionsExplorer() {
  const [view, setView] = useState<ViewMode>("simplest");
  const detailed = view === "detailed";

  return (
    <div className="flex flex-col gap-16 lg:gap-20">
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <div
          role="group"
          aria-label="View"
          className="inline-flex w-full rounded-full border-2 border-ink bg-paper p-1 sm:w-auto"
        >
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={view === option.value}
              onClick={() => setView(option.value)}
              className={clsx(
                "flex-1 rounded-full px-3 py-2 text-xs font-bold sm:flex-none sm:px-5 sm:text-sm",
                view === option.value ? "bg-ink text-paper" : "text-ink hover:bg-surface",
                focusRing,
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          {HINTS[view]}
        </p>
      </div>

      {view === "simplest" ? (
        <YearExplorer />
      ) : (
        <>
          <LatestResults detailed={detailed} />
          <CompareElections detailed={detailed} />
          <ElectionsInfo />
        </>
      )}
    </div>
  );
}
