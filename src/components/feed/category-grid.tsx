import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CategoryNode } from "@/lib/types";
import { focusRing } from "@/lib/ui";

type CategoryGridProps = {
  categories: CategoryNode[];
  headingLevel?: "h2" | "h3";
};

/** One card per section with its description, story count, and subcategory links. */
export function CategoryGrid({ categories, headingLevel = "h3" }: CategoryGridProps) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <li key={category.id}>
          <article className="group relative flex h-full flex-col gap-3 rounded-xl border border-border bg-paper p-6 motion-safe:transition motion-safe:duration-200 hover:shadow-lg motion-safe:hover:-translate-y-1">
            <Heading className="font-serif text-xl font-semibold text-ink group-hover:text-primary">
              <Link
                href={`/news?category=${category.slug}`}
                className={clsx("rounded-sm after:absolute after:inset-0 after:content-['']", focusRing)}
              >
                {category.name}
              </Link>
            </Heading>
            <p className="flex-1 text-base leading-7 text-muted">{category.description}</p>
            {category.children.length > 0 ? (
              <ul aria-label={`${category.name} subcategories`} className="relative z-10 flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/news?category=${child.slug}`}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-ink hover:border-primary hover:text-primary",
                        focusRing,
                      )}
                    >
                      {child.name}
                      <span className="font-normal text-muted">{child.postCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="flex items-center justify-between text-sm font-semibold text-primary">
              <span>
                {category.postCount} published {category.postCount === 1 ? "story" : "stories"}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
              />
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
