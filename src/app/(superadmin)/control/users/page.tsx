// READ-ONLY PAGE: this view lists reader accounts for reference only.
// Do not add buttons, checkboxes, row menus, or any edit or delete controls here.

import type { Metadata } from "next";
import { clsx } from "clsx";
import { Search, Users } from "lucide-react";
import { ReadOnlyBanner } from "@/components/dashboard/read-only-banner";
import { EmptyState } from "@/components/feed/empty-state";
import { Pagination } from "@/components/feed/pagination";
import { getReaders } from "@/lib/dashboard-data";
import { formatShortDate } from "@/lib/format";
import { requirePageRole } from "@/lib/session";
import { inputBase } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await requirePageRole("SUPER_ADMIN");

  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";
  const requested = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(requested) && requested >= 1 ? requested : 1;
  const readers = await getReaders(session, { q, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(readers.total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Users</h1>
        <p className="text-sm text-muted">Reader accounts. Readers do not need accounts to read Pulse, so this list is usually empty.</p>
      </header>

      <ReadOnlyBanner>Read-only view. User accounts can only be viewed here.</ReadOnlyBanner>

      <form role="search" method="get" action="/control/users" className="flex flex-col gap-2">
        <label htmlFor="users-search" className="text-sm font-semibold text-ink">
          Search by email
        </label>
        <div className="relative max-w-md">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            id="users-search"
            name="q"
            type="search"
            defaultValue={q}
            aria-describedby="users-search-hint"
            className={clsx(inputBase, "h-11 border-border pl-9 text-sm")}
          />
        </div>
        <p id="users-search-hint" className="text-sm text-muted">
          Press Enter to search.
        </p>
      </form>

      {readers.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No readers match that search" : "No reader accounts"}
          description="Readers browse Pulse without signing in. Staff accounts are managed on the Overview page."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-paper">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Reader accounts (read-only)</caption>
              <thead className="border-b border-border bg-surface text-xs tracking-wider text-ink uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last sign-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {readers.items.map((reader) => (
                  <tr key={reader.id}>
                    <th scope="row" className="px-5 py-4 font-medium text-ink">
                      {reader.email}
                    </th>
                    <td className="px-5 py-4 text-muted">
                      {reader.createdAt ? <time dateTime={reader.createdAt}>{formatShortDate(reader.createdAt)}</time> : "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {reader.lastSignInAt ? (
                        <time dateTime={reader.lastSignInAt}>{formatShortDate(reader.lastSignInAt)}</time>
                      ) : (
                        "Never"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pathname="/control/users" currentPage={page} totalPages={totalPages} params={{ q: q || undefined }} />
        </>
      )}
    </div>
  );
}
