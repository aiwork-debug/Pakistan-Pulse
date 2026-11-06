import type { HomepagePin, PostSummary } from "@/lib/types";

/**
 * Homepage positions a super admin can pin. Shared by the server action, the editor
 * (client), and the home page. Keep in sync with homepage_slots_slot_check (1 to 5).
 */
export const HOMEPAGE_SLOTS = [
  { slot: 1, label: "Main story", hint: "The large hero story at the top of the homepage." },
  { slot: 2, label: "Top story 2", hint: "First numbered story under the main story." },
  { slot: 3, label: "Top story 3", hint: "Second numbered story under the main story." },
  { slot: 4, label: "Top story 4", hint: "Third numbered story under the main story." },
  { slot: 5, label: "Top story 5", hint: "Fourth numbered story under the main story." },
] as const;

export const HOMEPAGE_SLOT_COUNT = HOMEPAGE_SLOTS.length;

export type ResolvedSlot = { slot: number; post: PostSummary; pinned: boolean };

/**
 * Decides which story fills each homepage slot. A slot a super admin pinned shows that
 * story; every empty slot takes the newest published story that is not already pinned.
 * `latest` must be newest first. Returns the filled slots and the unused latest stories.
 */
export function resolveHomepage(
  latest: PostSummary[],
  pins: HomepagePin[],
): { slots: ResolvedSlot[]; rest: PostSummary[] } {
  const pinned = new Map(pins.map((pin) => [pin.slot, pin.post]));
  const pinnedIds = new Set(pins.map((pin) => pin.post.id));
  const pool = latest.filter((post) => !pinnedIds.has(post.id));
  const slots: ResolvedSlot[] = [];
  for (const { slot } of HOMEPAGE_SLOTS) {
    const pin = pinned.get(slot);
    const post = pin ?? pool.shift();
    if (post) slots.push({ slot, post, pinned: Boolean(pin) });
  }
  return { slots, rest: pool };
}
