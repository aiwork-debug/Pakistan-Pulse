import { clsx } from "clsx";
import Link from "next/link";
import { focusRing, underlineGrow } from "@/lib/ui";

type SectionHeadingProps = {
  id: string;
  title: string;
  action?: { href: string; label: string };
  className?: string;
};

/** Section title with a thin primary rule above it and an optional "View all" link. */
export function SectionHeading({ id, title, action, className }: SectionHeadingProps) {
  return (
    <div className={clsx("flex items-end justify-between gap-6 border-t-2 border-primary pt-4", className)}>
      <h2 id={id} className="font-serif text-3xl font-bold text-ink">
        {title}
      </h2>
      {action ? (
        <Link
          href={action.href}
          className={clsx("shrink-0 rounded-sm text-sm font-semibold text-primary", underlineGrow, focusRing)}
        >
          {action.label}
          <span className="sr-only"> {title.toLowerCase()}</span>
        </Link>
      ) : null}
    </div>
  );
}
