import { clsx } from "clsx";
import Link from "next/link";
import { focusRing } from "@/lib/ui";

type PaginationProps = {
  pathname: string;
  currentPage: number;
  totalPages: number;
  /** Query parameters kept on every page link. */
  params?: Record<string, string | undefined>;
};

const baseClass = clsx(
  "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium",
  focusRing,
);

export function Pagination({ pathname, currentPage, totalPages, params = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (page > 1) search.set("page", String(page));
    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const idle = "border-border text-ink hover:border-primary hover:text-primary";

  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        {currentPage > 1 ? (
          <li>
            <Link href={hrefFor(currentPage - 1)} className={clsx(baseClass, idle)}>
              Previous
            </Link>
          </li>
        ) : null}
        {pages.map((page) => {
          const active = page === currentPage;
          return (
            <li key={page}>
              <Link
                href={hrefFor(page)}
                aria-current={active ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={clsx(baseClass, active ? "border-primary bg-primary text-paper" : idle)}
              >
                {page}
              </Link>
            </li>
          );
        })}
        {currentPage < totalPages ? (
          <li>
            <Link href={hrefFor(currentPage + 1)} className={clsx(baseClass, idle)}>
              Next
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
