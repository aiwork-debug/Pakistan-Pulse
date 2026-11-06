"use client";

import { clsx } from "clsx";
import { Clapperboard, FileText, Images, MonitorPlay, type LucideIcon } from "lucide-react";

export type StoryKind = "article" | "photo" | "video" | "youtube";

const KINDS: { kind: StoryKind; label: string; description: string; icon: LucideIcon }[] = [
  { kind: "article", label: "Written story", description: "Text first, with optional media.", icon: FileText },
  { kind: "photo", label: "Photo story", description: "Opens with a large image.", icon: Images },
  { kind: "video", label: "Video", description: "Opens with an uploaded video.", icon: Clapperboard },
  { kind: "youtube", label: "YouTube video", description: "Opens with a YouTube embed.", icon: MonitorPlay },
];

type StoryKindPickerProps = {
  value: StoryKind;
  onChange: (kind: StoryKind) => void;
};

/**
 * "What are you posting?" choice at the top of the editor. Picking a media kind adds the
 * matching block at the top of the story body; video kinds also list the story on /videos.
 */
export function StoryKindPicker({ value, onChange }: StoryKindPickerProps) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-border bg-paper p-6">
      <legend className="sr-only">What are you posting?</legend>
      <p aria-hidden="true" className="text-lg font-semibold text-ink">
        What are you posting?
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KINDS.map(({ kind, label, description, icon: Icon }) => (
          <label
            key={kind}
            className={clsx(
              "relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 motion-safe:transition-colors",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
              value === kind ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
            )}
          >
            <input
              type="radio"
              name="story-kind"
              value={kind}
              checked={value === kind}
              onChange={() => onChange(kind)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={clsx(
                "flex size-10 shrink-0 items-center justify-center rounded-md",
                value === kind ? "bg-primary text-paper" : "bg-surface text-ink",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">{label}</span>
              <span className="text-xs leading-5 text-muted">{description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
