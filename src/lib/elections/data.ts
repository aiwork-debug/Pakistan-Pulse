import { CONGRESS_SEAT_ROWS, NGA_GOVERNOR_ROWS, RICH_RECORDS } from "@/lib/elections/raw-data";
import type {
  ChamberKey,
  ControlKey,
  ElectionRecord,
  ElectionType,
  ElectionYear,
  PartyKey,
  SeatChange,
} from "@/lib/elections/types";

export { INDEX_SOURCE, RETRIEVED, SOURCES } from "@/lib/elections/raw-data";

export const CHAMBERS: ChamberKey[] = ["senate", "house", "gov"];

export const CHAMBER_NAMES: Record<ChamberKey, string> = {
  senate: "US Senate",
  house: "US House",
  gov: "Governors",
};

export const LATEST_YEAR = 2026;

/** Every federal election cycle from 1788/89 to 2026, newest first. Presidential years are divisible by 4. */
export const ELECTION_INDEX: ElectionYear[] = Array.from(
  { length: (LATEST_YEAR - 1788) / 2 + 1 },
  (_, i) => {
    const year = LATEST_YEAR - i * 2;
    const type: ElectionType = year % 4 === 0 ? "pres" : "mid";
    return { year, label: year === 1788 ? "1788/89" : String(year), type };
  },
);

export const ELECTION_BY_YEAR: Record<number, ElectionYear> = Object.fromEntries(
  ELECTION_INDEX.map((entry) => [entry.year, entry]),
);

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

/** Party names as recorded for each period. They are not modern equivalents. */
function periodParties(n: number): [string, string, string] {
  if (n <= 3) return ["Anti-Administration", "Pro-Administration", "Founding-era factions"];
  if (n <= 17)
    return ["Democratic-Republicans", "Federalists", "Democratic-Republican / Federalist era"];
  if (n === 18) return ["Jackson faction", "Adams–Clay faction", "Factional transition era"];
  if (n <= 20) return ["Jackson faction", "Adams faction", "Factional transition era"];
  if (n <= 24) return ["Jackson faction", "Anti-Jackson faction", "Jacksonian party era"];
  if (n <= 33) return ["Democrats", "Whigs", "Democrats / Whigs era"];
  if (n === 34) return ["Democrats", "Opposition coalition", "Opposition coalition era"];
  return ["Democrats", "Republicans", "Democrats / Republicans era"];
}

function buildData(): Record<ChamberKey, Record<number, ElectionRecord>> {
  const data: Record<ChamberKey, Record<number, ElectionRecord>> = {
    senate: { ...RICH_RECORDS.senate },
    house: { ...RICH_RECORDS.house },
    gov: { ...RICH_RECORDS.gov },
  };

  for (const [n, sd, sr, so, hd, hr, ho] of CONGRESS_SEAT_ROWS) {
    const year = 1788 + 2 * (n - 1);
    const [p1, p2, era] = periodParties(n);
    const pairs: [ChamberKey, number, number, number][] = [
      ["senate", sd, sr, so],
      ["house", hd, hr, ho],
    ];
    for (const [chamber, a, b, o] of pairs) {
      const existing = data[chamber][year];
      // Keep the richer modern and reference records.
      if (existing && !existing.baseline) continue;
      const total = a + b + o;
      const control: ControlKey = Math.max(a, b) > total / 2 ? (a > b ? "D" : "R") : "N";
      data[chamber][year] = {
        status: "historical",
        total,
        after: { D: a, R: b, O: o },
        partyLabels: { D: p1, R: p2 },
        comparisonEra: era,
        historicalNames: n < 35,
        historicalCompiled: true,
        control,
        asOf: `Opening of ${ordinal(n)} Congress (${1789 + 2 * (n - 1)}), compiled historical snapshot`,
        note: "Congressional party composition, not individual races won. The 'Other' category in the compilation may include third parties and vacant seats. Source tables may use different historical reference dates.",
        changeNA: "Seat flips not established by this aggregate source",
        src: ["compiled", "histSen", "histHouse"],
      };
    }
  }

  for (const [year, d, r, i, o] of NGA_GOVERNOR_ROWS) {
    if (data.gov[year]) continue;
    data.gov[year] = {
      status: "historical",
      total: d + r + i + o,
      after: { D: d, R: r, I: i, O: o },
      asOf: `NGA annual snapshot for ${year + 1} (following the ${year} election year)`,
      comparisonEra: "Democrats / Republicans era",
      governorAnnualSnapshot: true,
      note: "Governors serving in the following calendar year. It is NOT the number of governor races won in that election; some governorships change outside the election cycle.",
      changeNA:
        "Races won and seats flipped are not recorded in this annual party-affiliation table",
      src: ["ngaHist"],
    };
  }

  return data;
}

export const ELECTION_DATA = buildData();

/** Years (oldest first) with at least one chamber's party totals. */
export const PARTY_RESULT_YEARS: number[] = ELECTION_INDEX.map((entry) => entry.year)
  .filter((year) => CHAMBERS.some((chamber) => getRecord(chamber, year)))
  .sort((a, b) => a - b);

export function getRecord(chamber: ChamberKey, year: number): ElectionRecord | undefined {
  const record = ELECTION_DATA[chamber][year];
  return record && !record.baseline ? record : undefined;
}

/* ---------- Calculations ---------- */

export function seats(
  record: { after: Partial<Record<PartyKey, number>> } | undefined,
  key: PartyKey,
): number {
  return record?.after[key] ?? 0;
}

export function count(
  values: Partial<Record<PartyKey, number>> | undefined,
  key: PartyKey,
): number {
  return values?.[key] ?? 0;
}

export function majorityOf(record: ElectionRecord): number {
  return Math.floor(record.total / 2) + 1;
}

export function formatChange(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}

export function partyLabel(record: ElectionRecord | undefined, key: "D" | "R"): string {
  return record?.partyLabels?.[key] ?? (key === "D" ? "Democrats" : "Republicans");
}

export function isSamePartyPair(a: ElectionRecord, b: ElectionRecord): boolean {
  return partyLabel(a, "D") === partyLabel(b, "D") && partyLabel(a, "R") === partyLabel(b, "R");
}

export function electionTypeLabel(year: number): string {
  return ELECTION_BY_YEAR[year]?.type === "mid" ? "Midterm" : "Presidential";
}

/** Seat change attributable to the election itself, or null when it cannot be established. */
export function seatChange(chamber: ChamberKey, year: number): SeatChange | null {
  const record = getRecord(chamber, year);
  if (!record || record.changeNA) return null;
  if (record.changeOverride) return { ...record.changeOverride, O: 0, basis: "before" };
  if (record.status === "provisional") {
    if (!record.flips) return null;
    return {
      D: record.flips.toD - record.flips.toR,
      R: record.flips.toR - record.flips.toD,
      I: 0,
      O: 0,
      basis: "flips",
      atLeast: Boolean(record.flips.atLeast),
    };
  }
  let base = record.before;
  if (chamber === "house") {
    const previous = getRecord("house", year - 2);
    if (!previous || previous.total !== record.total) return null;
    base = previous.after;
  }
  if (!base) return null;
  return {
    D: count(record.after, "D") - count(base, "D"),
    R: count(record.after, "R") - count(base, "R"),
    I: count(record.after, "I") - count(base, "I"),
    O: count(record.after, "O") - count(base, "O"),
    basis: chamber === "house" ? "prev" : "before",
  };
}

export function changeLabel(chamber: ChamberKey, year: number, change: SeatChange): string {
  if (change.basis === "flips") return "Confirmed gains so far";
  if (chamber === "house") return `Gains and losses vs ${year - 2}`;
  return "Gains and losses in this election";
}

/** How many of the three categories (Senate, House, Governors) have party totals for a year. */
export function coverageOf(year: number): number {
  return CHAMBERS.filter((chamber) => getRecord(chamber, year)).length;
}

/** The same checks the original prototype runs before publishing. Returns a list of problems. */
export function validateElectionData(): string[] {
  const problems: string[] = [];
  const total = (values: Partial<Record<PartyKey, number>>) =>
    Object.values(values).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  for (const chamber of CHAMBERS) {
    for (const [year, record] of Object.entries(ELECTION_DATA[chamber])) {
      if (record.baseline) continue;
      if (total(record.after) !== record.total)
        problems.push(`${chamber} ${year}: seats add to ${total(record.after)}`);
      if (record.before && total(record.before) !== record.total)
        problems.push(`${chamber} ${year}: pre-election seats`);
      if (chamber === "senate" && record.won && total(record.won) !== record.contested)
        problems.push(`senate ${year}: races won do not match contested`);
      for (const snapshot of record.snapshots ?? []) {
        const n = snapshot.D + snapshot.R + (snapshot.I ?? 0) + (snapshot.U ?? 0);
        if (n !== record.total) problems.push(`${chamber} ${year} snapshot ${snapshot.when}`);
      }
      if (!record.src.length) problems.push(`${chamber} ${year}: no source`);
      if (
        record.status === "provisional" &&
        record.outstanding &&
        record.outstanding.length !== seats(record, "U")
      )
        problems.push(`${chamber} ${year}: outstanding list does not match uncalled count`);
    }
  }
  return problems;
}
