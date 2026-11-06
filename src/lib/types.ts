export type Role = "ADMIN" | "SUPER_ADMIN";

export type ProfileStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** A section. Top-level sections have no parent; subcategories point at their parent. */
export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  parentId: string | null;
};

/** postCount includes the stories filed under a category's subcategories. */
export type CategoryWithCount = Category & { postCount: number };

/** A top-level section with its subcategories, as built by buildCategoryTree. */
export type CategoryNode = CategoryWithCount & { children: CategoryWithCount[] };

/** The category reference carried by a story. `parent` is set when it sits in a subcategory. */
export type PostCategory = {
  slug: string;
  name: string;
  parent: { slug: string; name: string } | null;
};

/** Public author data, read from the public_profiles view. No email. */
export type AuthorProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarGradient: string;
  role: Role;
  status: ProfileStatus;
};

export type ParagraphBlock = { type: "paragraph"; text: string };
export type HeadingBlock = { type: "heading"; text: string };
export type QuoteBlock = { type: "quote"; text: string; attribution: string };
export type ImageBlock = { type: "image"; url: string; alt: string; caption: string };
export type YoutubeBlock = { type: "youtube"; videoId: string; title: string };
export type TweetBlock = { type: "tweet"; author: string; handle: string; text: string };
export type VideoBlock = { type: "video"; src: string; poster: string; title: string };

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ImageBlock
  | YoutubeBlock
  | TweetBlock
  | VideoBlock;

export type BlockType = Block["type"];

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  status: PostStatus;
  coverGradient: string;
  coverImageUrl: string | null;
  coverAlt: string;
  readMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: PostCategory | null;
  author: { username: string; displayName: string; avatarGradient: string } | null;
};

export type PostDetail = PostSummary & { blocks: Block[] };

/** Everything the editor needs to load an existing post. */
export type EditablePost = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  categoryId: string | null;
  coverImageUrl: string | null;
  coverAlt: string;
  readMinutes: number;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
  blocks: Block[];
};

/** A story a super admin pinned to a homepage slot (1 = hero, 2-5 = top stories). */
export type HomepagePin = { slot: number; post: PostSummary };

/** One published story as an option in the homepage editor. */
export type HomepageOption = {
  id: string;
  title: string;
  publishedAt: string | null;
  authorName: string | null;
};

export type MediaItem = {
  id: string;
  publicUrl: string;
  storagePath: string;
  mime: string;
  sizeBytes: number;
  altText: string;
  createdAt: string;
};

export type AuditEntry = {
  id: number;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorName: string | null;
};

export type AdminRow = {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  status: ProfileStatus;
  storyCount: number;
  lastSignInAt: string | null;
};

export type ReaderRow = {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type VideoKind = "uploaded" | "youtube";

export type VideoItem = {
  id: string;
  kind: VideoKind;
  title: string;
  /** YouTube video ID for embeds. Null for uploaded videos. */
  videoId: string | null;
  post: PostSummary;
};

export type SiteStats = {
  publishedStories: number;
  categories: number;
  activeContributors: number;
  videos: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
