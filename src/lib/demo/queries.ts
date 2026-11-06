import "server-only";

import { getDemoState, type DemoPost } from "@/lib/demo/store";
import type {
  AdminRow,
  AuditEntry,
  AuthorProfile,
  CategoryWithCount,
  EditablePost,
  HomepageOption,
  HomepagePin,
  MediaItem,
  Paginated,
  PostDetail,
  PostStatus,
  PostSummary,
  SiteStats,
  VideoItem,
} from "@/lib/types";

/*
 * Demo-mode versions of the queries in src/lib/data.ts and src/lib/dashboard-data.ts.
 * They apply the same visibility rules the RLS policies enforce in the real database:
 * public readers only ever see PUBLISHED posts.
 */

const time = (iso: string | null) => (iso ? Date.parse(iso) : 0);

export function demoToSummary(post: DemoPost): PostSummary {
  const state = getDemoState();
  const category = state.categories.find((c) => c.id === post.categoryId);
  const parent = category?.parentId ? state.categories.find((c) => c.id === category.parentId) : undefined;
  const author = state.profiles.find((profile) => profile.id === post.authorId);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    dek: post.dek,
    status: post.status,
    coverGradient: post.coverGradient,
    coverImageUrl: post.coverImageUrl,
    coverAlt: post.coverAlt,
    readMinutes: post.readMinutes,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    category: category
      ? {
          slug: category.slug,
          name: category.name,
          parent: parent ? { slug: parent.slug, name: parent.name } : null,
        }
      : null,
    author: author
      ? { username: author.username, displayName: author.displayName, avatarGradient: author.avatarGradient }
      : null,
  };
}

function published(): DemoPost[] {
  return getDemoState()
    .posts.filter((post) => post.status === "PUBLISHED")
    .sort((a, b) => time(b.publishedAt) - time(a.publishedAt));
}

export function demoLatestPosts(limit: number, offset = 0): PostSummary[] {
  return published().slice(offset, offset + limit).map(demoToSummary);
}

export function demoOldestPosts(limit: number): PostSummary[] {
  return [...published()].reverse().slice(0, limit).map(demoToSummary);
}

export function demoListPublished(options: {
  categorySlug?: string;
  q?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}): Paginated<PostSummary> {
  const pageSize = options.pageSize ?? 12;
  const page = Math.max(1, options.page ?? 1);
  // A section matches its own stories and those in its subcategories.
  const state = getDemoState();
  const category = options.categorySlug ? state.categories.find((c) => c.slug === options.categorySlug) : undefined;
  const family = new Set(
    category ? [category.id, ...state.categories.filter((c) => c.parentId === category.id).map((c) => c.id)] : [],
  );
  const needle = options.q?.trim().toLowerCase();

  let items = published().filter((post) => {
    if (options.categorySlug && (!post.categoryId || !family.has(post.categoryId))) return false;
    if (needle && !post.title.toLowerCase().includes(needle) && !post.dek.toLowerCase().includes(needle)) {
      return false;
    }
    return true;
  });
  if (options.sort === "oldest") items = items.reverse();

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize).map(demoToSummary),
    total: items.length,
    page,
    pageSize,
  };
}

export function demoPostBySlug(slug: string): PostDetail | null {
  const post = published().find((candidate) => candidate.slug === slug);
  return post ? { ...demoToSummary(post), blocks: post.blocks } : null;
}

export function demoRelatedPosts(post: PostSummary, limit: number): PostSummary[] {
  if (!post.category) return [];
  const categorySlug = post.category.slug;
  return published()
    .map(demoToSummary)
    .filter((candidate) => candidate.id !== post.id && candidate.category?.slug === categorySlug)
    .slice(0, limit);
}

export function demoCategoriesWithCounts(): CategoryWithCount[] {
  const posts = published();
  return [...getDemoState().categories]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => ({
      ...category,
      postCount: posts.filter((post) => post.categoryId === category.id).length,
    }));
}

export function demoAuthorByUsername(username: string): AuthorProfile | null {
  const profile = getDemoState().profiles.find((candidate) => candidate.username === username);
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarGradient: profile.avatarGradient,
    role: profile.role,
    status: profile.status,
  };
}

export function demoPostsByAuthor(authorId: string): PostSummary[] {
  return published()
    .filter((post) => post.authorId === authorId)
    .map(demoToSummary);
}

export function demoVideoItems(options: {
  kind?: "uploaded" | "youtube";
  authorId?: string;
  limit?: number;
}): VideoItem[] {
  const items: VideoItem[] = [];
  for (const post of published()) {
    if (options.authorId && post.authorId !== options.authorId) continue;
    post.blocks.forEach((block, index) => {
      if (block.type !== "video" && block.type !== "youtube") return;
      const kind = block.type === "video" ? "uploaded" : "youtube";
      if (options.kind && options.kind !== kind) return;
      items.push({
        id: `${post.id}-${index}`,
        kind,
        title: block.title || post.title,
        videoId: block.type === "youtube" ? block.videoId : null,
        post: demoToSummary(post),
      });
    });
  }
  return items.slice(0, options.limit ?? 60);
}

/** Pinned homepage stories that are currently PUBLISHED, in slot order. */
export function demoHomepagePins(): HomepagePin[] {
  const state = getDemoState();
  return [...state.homepage]
    .sort((a, b) => a.slot - b.slot)
    .flatMap((pin) => {
      const post = state.posts.find((candidate) => candidate.id === pin.postId && candidate.status === "PUBLISHED");
      return post ? [{ slot: pin.slot, post: demoToSummary(post) }] : [];
    });
}

/** Raw slot assignments for the super admin editor, including pins that are not live. */
export function demoHomepageAssignments(): Record<number, string> {
  return Object.fromEntries(getDemoState().homepage.map((pin) => [pin.slot, pin.postId]));
}

export function demoHomepageOptions(): HomepageOption[] {
  const state = getDemoState();
  return published().map((post) => ({
    id: post.id,
    title: post.title,
    publishedAt: post.publishedAt,
    authorName: state.profiles.find((profile) => profile.id === post.authorId)?.displayName ?? null,
  }));
}

export function demoSiteStats(): SiteStats {
  const state = getDemoState();
  const posts = published();
  const activeAuthors = new Set(
    posts
      .filter((post) => state.profiles.find((profile) => profile.id === post.authorId)?.status === "ACTIVE")
      .map((post) => post.authorId),
  );
  return {
    publishedStories: posts.length,
    categories: state.categories.length,
    activeContributors: activeAuthors.size,
    videos: posts.reduce(
      (sum, post) => sum + post.blocks.filter((b) => b.type === "video" || b.type === "youtube").length,
      0,
    ),
  };
}

// ---------------------------------------------------------------------------
// Staff queries
// ---------------------------------------------------------------------------

export function demoAdminPosts(userId: string, status?: PostStatus): PostSummary[] {
  return getDemoState()
    .posts.filter((post) => post.authorId === userId && (!status || post.status === status))
    .sort((a, b) => time(b.updatedAt) - time(a.updatedAt))
    .map(demoToSummary);
}

export function demoAdminCounts(userId: string) {
  const state = getDemoState();
  const own = state.posts.filter((post) => post.authorId === userId);
  return {
    published: own.filter((post) => post.status === "PUBLISHED").length,
    drafts: own.filter((post) => post.status === "DRAFT").length,
    archived: own.filter((post) => post.status === "ARCHIVED").length,
    media: state.media.filter((item) => item.uploaderId === userId && !item.deletedAt).length,
  };
}

export function demoEditablePost(userId: string, id: string): EditablePost | null {
  const post = getDemoState().posts.find((candidate) => candidate.id === id && candidate.authorId === userId);
  if (!post) return null;
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    dek: post.dek,
    categoryId: post.categoryId,
    coverImageUrl: post.coverImageUrl,
    coverAlt: post.coverAlt,
    readMinutes: post.readMinutes,
    status: post.status,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    blocks: post.blocks,
  };
}

export function demoMediaForUploader(userId: string): MediaItem[] {
  return getDemoState()
    .media.filter((item) => item.uploaderId === userId && !item.deletedAt)
    .sort((a, b) => time(b.createdAt) - time(a.createdAt))
    .map(({ id, publicUrl, storagePath, mime, sizeBytes, altText, createdAt }) => ({
      id,
      publicUrl,
      storagePath,
      mime,
      sizeBytes,
      altText,
      createdAt,
    }));
}

export function demoControlStats() {
  const state = getDemoState();
  const admins = state.profiles.filter((profile) => profile.role === "ADMIN");
  return {
    activeAdmins: admins.filter((profile) => profile.status === "ACTIVE").length,
    suspendedAdmins: admins.filter((profile) => profile.status === "SUSPENDED").length,
    totalAdmins: admins.length,
    publishedPosts: published().length,
  };
}

export function demoAdminRows(): AdminRow[] {
  const state = getDemoState();
  const posts = published();
  return state.profiles
    .filter((profile) => profile.role === "ADMIN")
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((profile) => ({
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      role: profile.role,
      status: profile.status,
      storyCount: posts.filter((post) => post.authorId === profile.id).length,
      lastSignInAt: profile.lastSignInAt,
    }));
}

export function demoAuditEntries(options: {
  action?: string;
  page?: number;
  pageSize?: number;
}): Paginated<AuditEntry> {
  const state = getDemoState();
  const pageSize = options.pageSize ?? 25;
  const page = Math.max(1, options.page ?? 1);
  const rows = state.audit
    .filter((entry) => !options.action || entry.action === options.action)
    .sort((a, b) => time(b.createdAt) - time(a.createdAt) || b.id - a.id);
  return {
    items: rows.slice((page - 1) * pageSize, page * pageSize).map((entry) => ({
      id: entry.id,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata,
      createdAt: entry.createdAt,
      actorName: state.profiles.find((profile) => profile.id === entry.actorId)?.displayName ?? null,
    })),
    total: rows.length,
    page,
    pageSize,
  };
}

export function demoAuditActions(): string[] {
  return [...new Set(getDemoState().audit.map((entry) => entry.action))].sort();
}
