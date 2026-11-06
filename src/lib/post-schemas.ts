import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/slug";
import { extractYoutubeId } from "@/lib/youtube";

/*
 * Editor input shapes and validation shared by the editor (client) and the post
 * server actions. The server always re-validates; client checks are only for feedback.
 */

export const TITLE_MIN = 5;
export const TITLE_MAX = 160;
export const DEK_MIN = 10;
export const DEK_MAX = 300;
export const COVER_ALT_MAX = 300;
export const MAX_BLOCKS = 200;
export const WORDS_PER_MINUTE = 220;

const str = (max: number) => z.string().max(max, `Must be ${max} characters or fewer.`);

/** Block shapes as the editor sends them. YouTube carries the raw URL or ID the admin pasted. */
export const blockInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: str(10000) }),
  z.object({ type: z.literal("heading"), text: str(200) }),
  z.object({ type: z.literal("quote"), text: str(2000), attribution: str(200) }),
  z.object({ type: z.literal("image"), url: str(2000), alt: str(300), caption: str(500) }),
  z.object({ type: z.literal("youtube"), url: str(300), title: str(200) }),
  z.object({ type: z.literal("tweet"), author: str(100), handle: str(50), text: str(1000) }),
  z.object({ type: z.literal("video"), src: str(500), poster: str(2000), title: str(200) }),
]);

export type BlockInput = z.infer<typeof blockInputSchema>;
export type BlockInputType = BlockInput["type"];

export const postInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters.`)
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer.`),
  slug: z.string().trim().max(SLUG_MAX_LENGTH, `Slug must be ${SLUG_MAX_LENGTH} characters or fewer.`),
  dek: z.string().trim().max(DEK_MAX, `Summary must be ${DEK_MAX} characters or fewer.`),
  categoryId: z.string().trim(),
  coverImageUrl: str(2000),
  coverAlt: z.string().trim().max(COVER_ALT_MAX, `Alt text must be ${COVER_ALT_MAX} characters or fewer.`),
  readMinutes: z.number().int().min(1, "Read time must be at least 1 minute.").max(240),
  blocks: z.array(blockInputSchema).max(MAX_BLOCKS, `A story can have at most ${MAX_BLOCKS} blocks.`),
});

export type PostInput = z.infer<typeof postInputSchema>;

export type FieldErrors = Record<string, string>;

const VIDEO_PATH_PATTERN = /^(?!.*\.\.)[A-Za-z0-9/_.-]+\.m3u8$/;

export function isValidVideoSource(src: string): boolean {
  if (!src) return true;
  if (/^https:\/\/\S+\.m3u8(\?\S*)?$/i.test(src)) return true;
  return VIDEO_PATH_PATTERN.test(src);
}

/**
 * https URLs (Supabase Storage), or the local paths demo mode uses: /demo-media/ for
 * uploads and /demo/ for the bundled dummy photos.
 */
function isHttpsUrl(value: string): boolean {
  if (value.startsWith("/demo-media/") || value.startsWith("/demo/")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Checks that apply to every save, including drafts and autosave. */
export function validateDraft(input: PostInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.slug && !SLUG_PATTERN.test(input.slug)) {
    errors.slug = "Use lowercase letters, numbers, and single hyphens only.";
  }
  if (input.coverImageUrl && !isHttpsUrl(input.coverImageUrl)) {
    errors.coverImageUrl = "Upload the cover image again; the link is not valid.";
  }
  input.blocks.forEach((block, index) => {
    if (block.type === "youtube" && block.url.trim() && !extractYoutubeId(block.url)) {
      errors[`blocks.${index}`] =
        "Paste a YouTube link (youtube.com/watch?v=, youtu.be/, youtube.com/embed/) or an 11-character video ID.";
    }
    if (block.type === "video" && !isValidVideoSource(block.src.trim())) {
      errors[`blocks.${index}`] = "Video source must be a storage path or https URL ending in .m3u8.";
    }
    if (block.type === "image" && block.url && !isHttpsUrl(block.url)) {
      errors[`blocks.${index}`] = "Upload the image again; the link is not valid.";
    }
  });
  return errors;
}

function blockPublishError(block: BlockInput): string | null {
  switch (block.type) {
    case "paragraph":
      return block.text.trim() ? null : "Paragraph text is empty.";
    case "heading":
      return block.text.trim() ? null : "Heading text is empty.";
    case "quote":
      if (!block.text.trim()) return "Quote text is empty.";
      return block.attribution.trim() ? null : "Add who the quote is from.";
    case "image":
      if (!block.url.trim()) return "Upload an image.";
      return block.alt.trim() ? null : "Add alt text describing the image.";
    case "youtube":
      if (!extractYoutubeId(block.url)) return "Add a valid YouTube link or video ID.";
      return block.title.trim() ? null : "Add a title for the video.";
    case "tweet":
      if (!block.author.trim() || !block.handle.trim()) return "Add the post's author and handle.";
      return block.text.trim() ? null : "Add the post text.";
    case "video":
      return block.title.trim() ? null : "Add a title for the video.";
  }
}

/** Full validation before a story goes live. Includes every draft check. */
export function validateForPublish(input: PostInput): FieldErrors {
  const errors = validateDraft(input);
  if (!input.slug) errors.slug = "Add a slug.";
  if (input.dek.length < DEK_MIN) errors.dek = `Summary must be at least ${DEK_MIN} characters.`;
  if (!input.categoryId) errors.categoryId = "Choose a category.";
  if (!input.coverImageUrl) errors.coverImageUrl ??= "Upload a cover image. Every published story needs one.";
  else if (!input.coverAlt) errors.coverAlt = "Describe the cover image for readers who cannot see it.";
  if (input.blocks.length === 0) errors.blocks = "Add at least one block to the story.";
  input.blocks.forEach((block, index) => {
    const key = `blocks.${index}`;
    if (errors[key]) return;
    const message = blockPublishError(block);
    if (message) errors[key] = message;
  });
  return errors;
}

function blockWords(block: BlockInput): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return block.text;
    case "quote":
      return `${block.text} ${block.attribution}`;
    case "image":
      return block.caption;
    case "tweet":
      return block.text;
    case "youtube":
    case "video":
      return "";
  }
}

/** Estimated read time in minutes, at roughly 220 words per minute. Minimum 1. */
export function estimateReadMinutes(title: string, dek: string, blocks: BlockInput[]): number {
  const text = [title, dek, ...blocks.map(blockWords)].join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
