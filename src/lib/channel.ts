/** URL helpers for the channel-style author page (/authors/<username>). */

export type ChannelTabKey = "home" | "stories" | "videos";

export function parseChannelTab(value: string | undefined): ChannelTabKey {
  return value === "stories" || value === "videos" ? value : "home";
}

/** /authors/<username>, with ?tab= and ?topic= only when they differ from the defaults. */
export function channelHref(username: string, tab: ChannelTabKey, topic?: string): string {
  const search = new URLSearchParams();
  if (tab !== "home") search.set("tab", tab);
  if (topic) search.set("topic", topic);
  const query = search.toString();
  return query ? `/authors/${username}?${query}` : `/authors/${username}`;
}
