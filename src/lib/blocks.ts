import { z } from "zod";
import type { BlockInput } from "@/lib/post-schemas";
import type { Block, BlockType } from "@/lib/types";

/** Stored payload shapes in post_blocks.payload, keyed by block type. */
const payloadSchemas = {
  paragraph: z.object({ text: z.string() }),
  heading: z.object({ text: z.string() }),
  quote: z.object({ text: z.string(), attribution: z.string() }),
  image: z.object({ url: z.string(), alt: z.string(), caption: z.string() }),
  youtube: z.object({ videoId: z.string(), title: z.string() }),
  tweet: z.object({ author: z.string(), handle: z.string(), text: z.string() }),
  video: z.object({ src: z.string(), poster: z.string(), title: z.string() }),
} as const;

function isBlockType(value: string): value is BlockType {
  return value in payloadSchemas;
}

/** Converts a stored row into a typed block. Returns null for rows that do not match. */
export function rowToBlock(type: string, payload: unknown): Block | null {
  if (!isBlockType(type)) return null;
  const parsed = payloadSchemas[type].safeParse(payload);
  if (!parsed.success) return null;
  return { type, ...parsed.data } as Block;
}

/** Converts a stored block into the editor's input shape. */
export function blockToInput(block: Block): BlockInput {
  if (block.type === "youtube") {
    return { type: "youtube", url: block.videoId, title: block.title };
  }
  return block;
}

/** Splits a block into its type and the payload stored in post_blocks. */
export function blockToRow(block: Block): { type: BlockType; payload: Record<string, string> } {
  const { type, ...payload } = block;
  return { type, payload };
}

/** Stable anchor id for a heading block, used by the table of contents. */
export function headingAnchor(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "section"}-${index}`;
}
