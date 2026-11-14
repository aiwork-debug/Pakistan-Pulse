import type { Metadata } from "next";
import { ElectionsExplorer } from "@/components/elections/elections-explorer";
import { ELECTION_INDEX } from "@/lib/elections/data";
import { kicker } from "@/lib/ui";

export const metadata: Metadata = {
  title: "US Elections: Balance of Power",
  description:
    "Who won, how many seats, and how the balance changed: US Senate, House and governor results for every federal election from 1788 to 2026.",
  alternates: { canonical: "/elections" },
};

export default function ElectionsPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      <header className="flex flex-col gap-5 border-b-2 border-ink py-12 sm:py-16">
        <p className={kicker}>US Election History</p>
        <h1 className="font-serif text-5xl leading-tight font-bold text-ink lg:text-6xl">
          Balance of Power
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          Who won, how many seats, and how the balance changed from one election to the next.
          Senate, House and governors across {ELECTION_INDEX.length} federal election cycles, 1788
          to 2026.
        </p>
      </header>

      <div className="pt-10">
        <ElectionsExplorer />
      </div>

      <p className="mt-16 border-t border-border pt-6 font-serif text-sm leading-6 text-muted">
        {ELECTION_INDEX.length} election years indexed (1788–2026). Senate and House party totals
        for 119 Congresses come from a published historical compilation citing the official House
        and Senate historians. Governor totals from the National Governors Association cover
        1900–2018. 2020–2026 records use individual sources; 2026 is a provisional, dated snapshot
        and not certified.
      </p>
    </div>
  );
}
