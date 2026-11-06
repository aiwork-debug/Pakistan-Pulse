import type { Metadata } from "next";
import { clsx } from "clsx";
import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/feed/empty-state";
import { Pagination } from "@/components/feed/pagination";
import { getAuditActions, getAuditEntries } from "@/lib/dashboard-data";
import { formatDateTime } from "@/lib/format";
import { requirePageRole } from "@/lib/session";
import { buttonSecondary, focusRing } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Audit log",
  robots: { index: false, follow: false },
};

type AuditLogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 25;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Read-only, append-only log. Filtering and pagination happen in the database. */
export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const session = await requirePageRole("SUPER_ADMIN");

  const params = await searchParams;
  const actions = await getAuditActions(session);
  const requestedAction = first(params.action);
  const action = requestedAction && actions.includes(requestedAction) ? requestedAction : undefined;
  const requested = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(requested) && requested >= 1 ? requested : 1;
  const log = await getAuditEntries(session, { action, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(log.total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold text-ink">Audit log</h1>
        <p className="text-sm text-muted">Every change to stories, media, and admin accounts, newest first. Entries cannot be edited or deleted.</p>
      </header>

      <form method="get" action="/control/audit-log" className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="audit-action" className="text-sm font-semibold text-ink">
            Filter by action
          </label>
          <select
            id="audit-action"
            name="action"
            defaultValue={action ?? ""}
            className={clsx("h-11 min-w-56 rounded-md border border-border bg-paper px-3 text-sm text-ink", focusRing)}
          >
            <option value="">All actions</option>
            {actions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={clsx(buttonSecondary, "w-fit")}>
          Apply filter
        </button>
      </form>

      <p role="status" className="text-sm text-muted">
        {log.total} {log.total === 1 ? "entry" : "entries"}
        {action ? ` for ${action}` : ""}
      </p>

      {log.items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No entries" description="No audit entries match this filter yet." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-paper">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Audit log entries, newest first</caption>
              <thead className="border-b border-border bg-surface text-xs tracking-wider text-ink uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Time</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Actor</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {log.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-5 py-4 whitespace-nowrap text-muted">
                      <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                    </td>
                    <td className="px-5 py-4 text-ink">{entry.actorName ?? "System"}</td>
                    <td className="px-5 py-4">
                      <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-ink">{entry.action}</code>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {entry.targetType}
                      {typeof entry.metadata.slug === "string" ? `: ${entry.metadata.slug}` : ""}
                      {typeof entry.metadata.username === "string" ? `: @${entry.metadata.username}` : ""}
                      {typeof entry.metadata.mode === "string" ? ` (${entry.metadata.mode})` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pathname="/control/audit-log" currentPage={page} totalPages={totalPages} params={{ action }} />
        </>
      )}
    </div>
  );
}
