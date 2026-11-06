"use client";

import { clsx } from "clsx";
import { useCallback, useRef, useState, useTransition } from "react";
import {
  deleteAdminAction,
  reactivateAdminAction,
  suspendAdminAction,
  type AdminActionResult,
  type DeleteMode,
} from "@/app/actions/admins";
import { DeleteAdminDialog } from "@/components/dashboard/delete-admin-dialog";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ToastMessage } from "@/components/ui/toast-message";
import { formatDateTime } from "@/lib/format";
import type { AdminRow } from "@/lib/types";
import { focusRing } from "@/lib/ui";

type AdminsTableProps = {
  admins: AdminRow[];
  /** Whether management controls are shown (UI only; the server actions re-check). */
  canManage: boolean;
};

const buttonClass = clsx(
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink hover:border-primary hover:text-primary disabled:opacity-60",
  focusRing,
);

export function AdminsTable({ admins, canManage }: AdminsTableProps) {
  const [deleting, setDeleting] = useState<AdminRow | null>(null);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closeDialog = useCallback(() => {
    setDeleting(null);
    triggerRef.current?.focus();
  }, []);

  function run(adminId: string, action: () => Promise<AdminActionResult>) {
    setPendingId(adminId);
    startTransition(async () => {
      setResult(await action());
      setPendingId(null);
    });
  }

  if (admins.length === 0) {
    return <p className="rounded-xl border border-dashed border-border bg-paper p-6 text-sm text-muted">No admins yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {result ? (
        <ToastMessage tone={result.ok ? "success" : "error"}>{result.ok ? result.message : result.error}</ToastMessage>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-paper">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Admins</caption>
          <thead className="border-b border-border bg-surface text-xs tracking-wider text-ink uppercase">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Name</th>
              <th scope="col" className="px-5 py-3 font-semibold">Username</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3 font-semibold">Stories</th>
              <th scope="col" className="px-5 py-3 font-semibold">Last active</th>
              {canManage ? <th scope="col" className="px-5 py-3 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {admins.map((admin) => {
              const busy = isPending && pendingId === admin.id;
              return (
                <tr key={admin.id}>
                  <th scope="row" className="px-5 py-4 font-medium text-ink">
                    {admin.displayName}
                  </th>
                  <td className="px-5 py-4 text-muted">{admin.username}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={admin.status} />
                  </td>
                  <td className="px-5 py-4 text-muted">{admin.storyCount}</td>
                  <td className="px-5 py-4 text-muted">
                    {admin.lastSignInAt ? (
                      <time dateTime={admin.lastSignInAt}>{formatDateTime(admin.lastSignInAt)}</time>
                    ) : (
                      "Never"
                    )}
                  </td>
                  {canManage ? (
                    <td className="px-5 py-4">
                      {admin.status === "ARCHIVED" ? (
                        <span className="text-sm text-muted">Deleted</span>
                      ) : (
                        <div className="flex gap-2">
                          {admin.status === "ACTIVE" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => run(admin.id, () => suspendAdminAction(admin.id))}
                              aria-label={`Suspend ${admin.displayName}`}
                              className={buttonClass}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => run(admin.id, () => reactivateAdminAction(admin.id))}
                              aria-label={`Reactivate ${admin.displayName}`}
                              className={buttonClass}
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={(event) => {
                              triggerRef.current = event.currentTarget;
                              setDeleting(admin);
                            }}
                            aria-label={`Delete ${admin.displayName}`}
                            className={buttonClass}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleting ? (
        <DeleteAdminDialog
          adminName={deleting.displayName}
          pending={isPending}
          onCancel={closeDialog}
          onConfirm={(mode: DeleteMode) => {
            const target = deleting;
            setPendingId(target.id);
            startTransition(async () => {
              setResult(await deleteAdminAction(target.id, mode));
              setPendingId(null);
              closeDialog();
            });
          }}
        />
      ) : null}
    </div>
  );
}
