import { clsx } from "clsx";
import Link from "next/link";
import { focusRing } from "@/lib/ui";

export type ChannelTab = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

type ChannelTabsProps = {
  tabs: ChannelTab[];
  label: string;
};

/** Underlined tab links (Home, Stories, Videos) under a channel header. Each tab is its own URL. */
export function ChannelTabs({ tabs, label }: ChannelTabsProps) {
  return (
    <nav aria-label={label} className="border-b border-border">
      <ul className="-mx-4 flex gap-8 overflow-x-auto px-4 sm:mx-0 sm:px-6">
        {tabs.map((tab) => (
          <li key={tab.href} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={clsx(
                "relative inline-flex items-center gap-2 rounded-sm py-4 text-base font-semibold",
                "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:content-['']",
                tab.active ? "text-ink after:bg-ink" : "text-muted hover:text-ink hover:after:bg-border",
                focusRing,
              )}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
                  {tab.count}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
