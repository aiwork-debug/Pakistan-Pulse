export type ChamberKey = "senate" | "house" | "gov";

/** D: Democrats (or the first historical group), R: Republicans (or the second), I: independents caucusing with D, O: other / vacancy, U: uncalled. */
export type PartyKey = "D" | "R" | "I" | "O" | "U";

export type Seats = Partial<Record<PartyKey, number>>;

export type RecordStatus = "final" | "provisional" | "historical";

export type ControlKey = "D" | "R" | "N";

export type ElectionType = "pres" | "mid";

export type ElectionYear = {
  year: number;
  label: string;
  type: ElectionType;
};

export type ElectionSource = {
  tier: "official" | "reference" | "news";
  org: string;
  title: string;
  url: string;
};

export type ElectionRecord = {
  status: RecordStatus;
  total: number;
  after: Seats;
  before?: Seats;
  contested?: number;
  won?: Seats;
  flips?: { toD: number; toR: number; atLeast?: boolean; list?: string };
  control?: ControlKey;
  controlWhy?: string;
  controlWord?: string;
  changeOverride?: { D: number; R: number; I: number };
  asOf?: string;
  note?: string;
  chosen?: string;
  changeNA?: string;
  oLabel?: string;
  uLabel?: string;
  outstanding?: { state: string; held: "D" | "R"; status: string }[];
  snapshots?: { when: string; by: string; D: number; R: number; I?: number; U?: number }[];
  projection?: { D: number; R: number; by: string };
  partyLabels?: { D: string; R: string };
  comparisonEra?: string;
  historicalNames?: boolean;
  historicalCompiled?: boolean;
  governorAnnualSnapshot?: boolean;
  baseline?: boolean;
  src: string[];
};

export type SeatChange = {
  D: number;
  R: number;
  I: number;
  O: number;
  basis: "before" | "prev" | "flips";
  atLeast?: boolean;
};
