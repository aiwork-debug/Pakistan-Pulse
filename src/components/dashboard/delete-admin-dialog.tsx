"use client";

import { clsx } from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import type { DeleteMode } from "@/app/actions/admins";
import { buttonSecondary, focusRing } from "@/lib/ui";

type DeleteAdminDialogProps = {
  adminName: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (mode: DeleteMode) => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Rendered only while open. The parent restores focus to the trigger when it closes. */
export function DeleteAdminDialog({ adminName, pending, onCancel, onConfirm }: DeleteAdminDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const [mode, setMode] = useState<DeleteMode>("archive");
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const dialog = dialogRef.current;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const options: { value: DeleteMode; label: string }[] = [
    { value: "archive", label: "Archive stories (keep them with a Former contributor label)" },
    { value: "unpublish", label: "Unpublish stories (move them to drafts)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-ink/50" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-lg rounded-xl border border-border bg-paper p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-xl font-semibold text-ink">
          Delete {adminName}?
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-muted">
          Their account is archived and they can no longer sign in. Choose what happens to their stories.
        </p>

        <fieldset className="mt-6 flex flex-col gap-3">
          <legend className="sr-only">What happens to their stories</legend>
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-checked:border-primary has-checked:bg-primary/5"
            >
              <input
                type="radio"
                name={`${id}-mode`}
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                className={clsx("mt-0.5 size-4 accent-primary", focusRing)}
              />
              <span className="text-sm text-ink">{option.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className={buttonSecondary}>
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onConfirm(mode)}
            className={clsx(
              "inline-flex h-11 items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-60",
              focusRing,
            )}
          >
            {pending ? "Deleting..." : "Delete admin"}
          </button>
        </div>
      </div>
    </div>
  );
}
