"use client";

import { clsx } from "clsx";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useActionState, useState } from "react";
import { unlockSiteAction, type SiteGateState } from "@/app/actions/site-gate";
import { buttonPrimary, focusRing, inputBase } from "@/lib/ui";

type SiteGateFormProps = {
  /** Page the visitor was trying to open, already checked by safeNext on the server. */
  next: string;
};

const initialState: SiteGateState = { error: null };

export function SiteGateForm({ next }: SiteGateFormProps) {
  const [state, formAction, pending] = useActionState(unlockSiteAction, initialState);
  const [visible, setVisible] = useState(false);
  const error = state.error;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="site-password" className="text-sm font-semibold text-ink">
          Team password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="site-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "site-password-error" : undefined}
            className={clsx(inputBase, "h-11 pr-12 pl-9", error ? "border-ink" : "border-border")}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className={clsx(
              "absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-ink",
              focusRing,
            )}
          >
            {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
        {error ? (
          <p id="site-password-error" role="alert" className="border-l-2 border-ink pl-2 text-sm text-ink">
            {error}
          </p>
        ) : null}
      </div>
      <button type="submit" disabled={pending} className={clsx(buttonPrimary, "w-full")}>
        {pending ? "Checking..." : "Enter site"}
      </button>
    </form>
  );
}
