"use client";

import { clsx } from "clsx";
import { AtSign, Clapperboard, Heading2, Image, MonitorPlay, Pilcrow, Quote, type LucideIcon } from "lucide-react";
import type { BlockInputType } from "@/lib/post-schemas";
import { focusRing } from "@/lib/ui";

export const BLOCK_ICONS: Record<BlockInputType, LucideIcon> = {
  paragraph: Pilcrow,
  heading: Heading2,
  quote: Quote,
  image: Image,
  youtube: MonitorPlay,
  tweet: AtSign,
  video: Clapperboard,
};

type BlockToolbarProps = {
  blockTypes: { type: BlockInputType; label: string }[];
  onAdd: (type: BlockInputType) => void;
};

/** "Add to story" toolbar. Sticks to the top of the screen on desktop while the body is long. */
export function BlockToolbar({ blockTypes, onAdd }: BlockToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Add to story"
      className="z-20 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-paper/95 p-2 shadow-sm backdrop-blur lg:sticky lg:top-4"
    >
      <span className="px-2 text-xs font-semibold tracking-[0.14em] text-muted uppercase">Add</span>
      {blockTypes.map(({ type, label }) => {
        const Icon = BLOCK_ICONS[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className={clsx(
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-ink hover:bg-surface hover:text-primary",
              focusRing,
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
