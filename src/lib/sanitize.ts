import "server-only";

import sanitizeHtml from "sanitize-html";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
};

/** Matches anything that still looks like an opening or closing tag. */
const TAG_LIKE = /<\/?[a-zA-Z!][^>]*>/g;

/**
 * Removes every HTML tag and returns plain text. sanitize-html escapes the remaining
 * text, so the basic entities are decoded back: stored text is plain, and React escapes
 * it again when rendering. A final pass removes any tag-shaped text that decoding revealed.
 * Nothing in the app renders stored text as HTML.
 */
export function stripTags(input: string): string {
  const stripped = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
  return stripped
    .replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(TAG_LIKE, "")
    .trim();
}
