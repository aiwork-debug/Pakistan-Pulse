import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { validateElectionData } from "@/lib/elections/data";
import { focusRing, textLink } from "@/lib/ui";

const DEFINITIONS: [string, string][] = [
  [
    "Seats",
    "Each party's total once that election's winners take their seats. Senate and House dates are shown in Detailed view.",
  ],
  [
    "Gains and losses in that election",
    "Senate and governors: the total after the election against the total just before it. House: the result against the previous election's result. For provisional results, only seats already called as taken from another party are counted.",
  ],
  [
    "Change between selected years",
    "Totals after one selected election against another. It includes everything in between, such as party switches and special elections, so it can differ from the gains in any single election.",
  ],
  [
    "Seats that changed party",
    "Individual seats one party took from another in that election. A party keeping its own seat is not a gain.",
  ],
  [
    "Control",
    'The party, or caucus, holding a majority of the chamber. Governors do not form a chamber, so no party controls "the governors".',
  ],
];

const LEGEND = [
  { label: "Democrats", swatch: "bg-dem-bar" },
  {
    label: "Independents who caucus with Democrats",
    swatch: "bg-other-bar bg-[linear-gradient(90deg,var(--color-dem-bar)_0_3px,transparent_3px)]",
  },
  { label: "Other parties", swatch: "bg-other-bar" },
  { label: "Republicans", swatch: "bg-rep-bar" },
  {
    label: "Uncalled",
    swatch:
      "border border-border bg-[repeating-linear-gradient(135deg,var(--color-uncalled)_0_4px,var(--color-paper)_4px_7px)]",
  },
  { label: "Historical party group 1 (pre-1857)", swatch: "bg-hist-a" },
  { label: "Historical party group 2 (pre-1857)", swatch: "bg-hist-b" },
];

const LINKS = [
  {
    href: "https://dataslapper.com/visualizations/party-control-white-house-senate-house/",
    label: "Historical Congress table",
  },
  {
    href: "https://history.house.gov/Institution/Party-Divisions/Party-Divisions/",
    label: "House Historian",
  },
  {
    href: "https://www.senate.gov/about/parties-leadership/party-division.shtml",
    label: "Senate Historical Office",
  },
  {
    href: "https://www.nga.org/wp-content/uploads/2019/03/Governors-Affiliations-1900-2019.pdf",
    label: "National Governors Association",
  },
];

const summaryClass = clsx(
  "flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 text-base font-bold text-ink hover:bg-surface [&::-webkit-details-marker]:hidden",
  focusRing,
);

/** Definitions, colour legend, source notes and the automatic data check. */
export function ElectionsInfo() {
  const problems = validateElectionData();

  return (
    <section aria-label="Definitions and sources" className="grid gap-4 lg:grid-cols-2">
      <details className="group rounded-lg border border-border bg-paper">
        <summary className={summaryClass}>
          What the numbers mean
          <ChevronDown
            aria-hidden="true"
            className="size-5 text-muted group-open:rotate-180 motion-safe:transition-transform"
          />
        </summary>
        <dl className="flex flex-col gap-4 px-5 pb-5 text-sm leading-6">
          {DEFINITIONS.map(([term, description]) => (
            <div key={term}>
              <dt className="font-semibold text-ink">{term}</dt>
              <dd className="text-muted">{description}</dd>
            </div>
          ))}
        </dl>
      </details>

      <details className="group rounded-lg border border-border bg-paper">
        <summary className={summaryClass}>
          About this data
          <ChevronDown
            aria-hidden="true"
            className="size-5 text-muted group-open:rotate-180 motion-safe:transition-transform"
          />
        </summary>
        <div className="flex flex-col gap-4 px-5 pb-5 text-sm leading-6 text-muted">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={clsx("inline-block h-3 w-[18px] rounded-sm", item.swatch)}
                />
                {item.label}
              </li>
            ))}
          </ul>
          <p>
            Congressional party seats for 1788–2024 are derived from a compiled 119-Congress table
            that cites the U.S. House Historian and Senate Historical Office. The 1900–2018
            governors series uses the National Governors Association&apos;s following-year annual
            totals. 2026 remains a dated provisional snapshot, not a live feed.
          </p>
          <p>
            Historical party names are displayed as recorded for their periods. For the very early
            Congresses, faction labels were fluid and Senate seating dates can differ from the
            House&apos;s initial election totals. Do not read the party labels or colours as modern
            ideological equivalents.
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={textLink}
              >
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </p>
          <p className={clsx("font-mono text-xs", problems.length ? "text-rep" : "text-primary")}>
            {problems.length
              ? `Data check: ${problems.length} problem(s). ${problems.join("; ")}`
              : "Data check passed: seats add up to each chamber's size, Senate races won match races held, every uncalled seat is listed, and every record has a source."}
          </p>
        </div>
      </details>
    </section>
  );
}
