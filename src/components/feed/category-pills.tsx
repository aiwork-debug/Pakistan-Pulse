import { clsx } from "clsx";
import Link from "next/link";
import { focusRing } from "@/lib/ui";

export type PillItem = {
  label: string;
  href: string;
  /** true marks the current page. "ancestor" highlights the section containing the current subcategory. */
  active?: boolean | "ancestor";
  /** Optional count shown after the label. */
  count?: number;
};

type CategoryPillsProps = {
  items: PillItem[];
  label: string;
  size?: "md" | "sm";
  className?: string;
};

/** A row of filter links. Scrolls horizontally on small screens and wraps from sm up. */
export function CategoryPills({ items, label, size = "md", className }: CategoryPillsProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.active === true ? "page" : item.active === "ancestor" ? "true" : undefined}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap motion-safe:transition-colors",
                size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
                item.active === true && "border-primary bg-primary text-paper",
                item.active === "ancestor" && "border-primary bg-paper text-primary",
                !item.active && "border-border text-ink hover:border-primary hover:text-primary",
                focusRing,
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className={clsx("font-normal", item.active === true ? "text-paper/80" : "text-muted")}>
                  {item.count}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
