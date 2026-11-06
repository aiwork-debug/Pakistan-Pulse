"use client";

import { clsx } from "clsx";
import { useState, useTransition } from "react";
import { saveHomepageAction } from "@/app/actions/homepage";
import { ToastMessage } from "@/components/ui/toast-message";
import { formatShortDate } from "@/lib/format";
import { HOMEPAGE_SLOTS } from "@/lib/homepage";
import type { HomepageOption } from "@/lib/types";
import { buttonPrimary, buttonSecondary, focusRing } from "@/lib/ui";

type HomepageSlotsFormProps = {
  options: HomepageOption[];
  /** Current pins: slot number to post id. */
  assignments: Record<number, string>;
};

const AUTOMATIC = "";

/**
 * Lets a super admin choose the story for each homepage position. "Automatic" keeps the
 * position on the newest story. A story can only be chosen for one position at a time.
 */
export function HomepageSlotsForm({ options, assignments }: HomepageSlotsFormProps) {
  const liveIds = new Set(options.map((option) => option.id));
  const initial = HOMEPAGE_SLOTS.map(({ slot }) => {
    const id = assignments[slot];
    return id && liveIds.has(id) ? id : AUTOMATIC;
  });
  // Pins whose story was unpublished or archived since; saving clears them.
  const stale = HOMEPAGE_SLOTS.filter(({ slot }) => assignments[slot] && !liveIds.has(assignments[slot])).length;

  const [values, setValues] = useState<string[]>(initial);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = values.some((value, index) => value !== initial[index]) || stale > 0;

  function setSlot(index: number, value: string) {
    setValues((current) => current.map((item, i) => (i === index ? value : item)));
    setMessage(null);
  }

  function save() {
    startTransition(async () => {
      const result = await saveHomepageAction(values.map((value) => value || null));
      setMessage(result.ok ? { tone: "success", text: result.message } : { tone: "error", text: result.error });
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="flex flex-col gap-6 rounded-xl border border-border bg-paper p-6"
    >
      {stale > 0 ? (
        <ToastMessage tone="warning">
          {stale === 1 ? "One pinned story is" : `${stale} pinned stories are`} no longer published, so{" "}
          {stale === 1 ? "its position is" : "their positions are"} shown as Automatic. Save to confirm.
        </ToastMessage>
      ) : null}

      <ol className="flex flex-col gap-5">
        {HOMEPAGE_SLOTS.map(({ slot, label, hint }, index) => {
          const id = `homepage-slot-${slot}`;
          const takenElsewhere = new Set(values.filter((value, i) => i !== index && value));
          return (
            <li key={slot} className="flex flex-col gap-2">
              <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-semibold text-ink">
                <span
                  aria-hidden="true"
                  className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary"
                >
                  {slot}
                </span>
                {label}
              </label>
              <select
                id={id}
                value={values[index]}
                aria-describedby={`${id}-hint`}
                onChange={(event) => setSlot(index, event.target.value)}
                className={clsx("h-11 w-full rounded-md border border-border bg-paper px-3 text-sm text-ink", focusRing)}
              >
                <option value={AUTOMATIC}>Automatic (newest story)</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id} disabled={takenElsewhere.has(option.id)}>
                    {option.title}
                    {option.publishedAt ? ` · ${formatShortDate(option.publishedAt)}` : ""}
                    {option.authorName ? ` · ${option.authorName}` : ""}
                    {takenElsewhere.has(option.id) ? " (used in another position)" : ""}
                  </option>
                ))}
              </select>
              <p id={`${id}-hint`} className="text-sm text-muted">
                {hint}
              </p>
            </li>
          );
        })}
      </ol>

      {message ? (
        <ToastMessage tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>
          {message.text}
        </ToastMessage>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <button type="submit" disabled={pending || !dirty} className={buttonPrimary}>
          {pending ? "Saving..." : "Save homepage"}
        </button>
        <button
          type="button"
          disabled={pending || values.every((value) => value === AUTOMATIC)}
          onClick={() => {
            setValues(HOMEPAGE_SLOTS.map(() => AUTOMATIC));
            setMessage(null);
          }}
          className={buttonSecondary}
        >
          Set all to automatic
        </button>
      </div>
    </form>
  );
}
