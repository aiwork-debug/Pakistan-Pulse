import "server-only";

import { and, asc, count, countDistinct, desc, eq, ilike, inArray, ne, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { withRls, type Tx } from "@/db";
import { publicProfiles } from "@/db/external";
import { categories, homepageSlots, postBlocks, posts } from "@/db/schema";
import { rowToBlock } from "@/lib/blocks";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/queries";
import { getDemoState } from "@/lib/demo/store";
import type {
  AuthorProfile,
  Block,
  Category,
  CategoryWithCount,
  HomepagePin,
  Paginated,
  PostDetail,
  PostStatus,
  PostSummary,
  ProfileStatus,
  Role,
  SiteStats,
  VideoItem,
} from "@/lib/types";

/*
 * Public data layer. Every query runs as the Supabase `anon` role through withRls(null),
 * so RLS limits results to published posts and public profile columns. The explicit
 * status filters below are a second line of defence, not the only one.
 */

const PUBLISHED = "PUBLISHED";

/** The parent of a story's category, joined a second time under its own name. */
const parentCategories = alias(categories, "parent_categories");

export type SortOrder = "newest" | "oldest";

const summaryColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  dek: posts.dek,
  status: posts.status,
  coverGradient: posts.coverGradient,
  coverImageUrl: posts.coverImageUrl,
  coverAlt: posts.coverAlt,
  readMinutes: posts.readMinutes,
  publishedAt: posts.publishedAt,
  createdAt: posts.createdAt,
  updatedAt: posts.updatedAt,
  categorySlug: categories.slug,
  categoryName: categories.name,
  parentSlug: parentCategories.slug,
  parentName: parentCategories.name,
  authorUsername: publicProfiles.username,
  authorName: publicProfiles.displayName,
  authorGradient: publicProfiles.avatarGradient,
};

export type SummaryRow = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  status: string;
  coverGradient: string;
  coverImageUrl: string | null;
  coverAlt: string;
  readMinutes: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categorySlug: string | null;
  categoryName: string | null;
  parentSlug: string | null;
  parentName: string | null;
  authorUsername: string | null;
  authorName: string | null;
  authorGradient: string | null;
};

export function summaryQuery(tx: Tx) {
  return tx
    .select(summaryColumns)
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(parentCategories, eq(categories.parentId, parentCategories.id))
    .leftJoin(publicProfiles, eq(posts.authorId, publicProfiles.id));
}

export function toSummary(row: SummaryRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    dek: row.dek,
    status: row.status as PostStatus,
    coverGradient: row.coverGradient,
    coverImageUrl: row.coverImageUrl,
    coverAlt: row.coverAlt,
    readMinutes: row.readMinutes,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    category:
      row.categorySlug && row.categoryName
        ? {
            slug: row.categorySlug,
            name: row.categoryName,
            parent:
              row.parentSlug && row.parentName ? { slug: row.parentSlug, name: row.parentName } : null,
          }
        : null,
    author:
      row.authorUsername && row.authorName
        ? {
            username: row.authorUsername,
            displayName: row.authorName,
            avatarGradient: row.authorGradient ?? "teal",
          }
        : null,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Stories a super admin pinned to the homepage, in slot order. Only PUBLISHED posts come
 * back (RLS on posts plus the explicit filter), so a pin on an unpublished story is skipped.
 */
export async function getHomepagePins(): Promise<HomepagePin[]> {
  if (isDemoMode()) return demo.demoHomepagePins();
  const rows = await withRls(null, (tx) =>
    tx
      .select({ slot: homepageSlots.slot, ...summaryColumns })
      .from(homepageSlots)
      .innerJoin(posts, eq(homepageSlots.postId, posts.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(parentCategories, eq(categories.parentId, parentCategories.id))
      .leftJoin(publicProfiles, eq(posts.authorId, publicProfiles.id))
      .where(eq(posts.status, PUBLISHED))
      .orderBy(asc(homepageSlots.slot)),
  );
  return rows.map(({ slot, ...row }) => ({ slot, post: toSummary(row) }));
}

/** Most recent published stories. */
export async function getLatestPosts(limit: number, offset = 0): Promise<PostSummary[]> {
  if (isDemoMode()) return demo.demoLatestPosts(limit, offset);
  const rows = await withRls(null, (tx) =>
    summaryQuery(tx)
      .where(eq(posts.status, PUBLISHED))
      .orderBy(desc(posts.publishedAt), desc(posts.id))
      .limit(limit)
      .offset(offset),
  );
  return rows.map(toSummary);
}

/** Oldest published stories, for editor's picks. */
export async function getOldestPosts(limit: number): Promise<PostSummary[]> {
  if (isDemoMode()) return demo.demoOldestPosts(limit);
  const rows = await withRls(null, (tx) =>
    summaryQuery(tx)
      .where(eq(posts.status, PUBLISHED))
      .orderBy(asc(posts.publishedAt), asc(posts.id))
      .limit(limit),
  );
  return rows.map(toSummary);
}

/**
 * Filtered, sorted, paginated list for /news. Sorting and filtering happen in the database.
 * A section's slug also matches the stories filed under its subcategories.
 */
export async function listPublishedPosts(options: {
  categorySlug?: string;
  q?: string;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<PostSummary>> {
  if (isDemoMode()) return demo.demoListPublished(options);
  const pageSize = options.pageSize ?? 12;
  const page = Math.max(1, options.page ?? 1);
  const filters: SQL[] = [eq(posts.status, PUBLISHED)];
  if (options.categorySlug) {
    const inFamily = or(eq(categories.slug, options.categorySlug), eq(parentCategories.slug, options.categorySlug));
    if (inFamily) filters.push(inFamily);
  }
  const q = options.q?.trim();
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    const match = or(ilike(posts.title, pattern), ilike(posts.dek, pattern));
    if (match) filters.push(match);
  }
  const where = and(...filters);
  const order =
    options.sort === "oldest"
      ? [asc(posts.publishedAt), asc(posts.id)]
      : [desc(posts.publishedAt), desc(posts.id)];

  return withRls(null, async (tx) => {
    const [{ value: total }] = await tx
      .select({ value: count() })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(parentCategories, eq(categories.parentId, parentCategories.id))
      .where(where);
    const rows = await summaryQuery(tx)
      .where(where)
      .orderBy(...order)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    return { items: rows.map(toSummary), total, page, pageSize };
  });
}

export async function loadBlocks(tx: Tx, postId: string): Promise<Block[]> {
  const rows = await tx
    .select({ type: postBlocks.type, payload: postBlocks.payload })
    .from(postBlocks)
    .where(eq(postBlocks.postId, postId))
    .orderBy(asc(postBlocks.position));
  return rows.map((row) => rowToBlock(row.type, row.payload)).filter((block) => block !== null);
}

/** A published story with its body, or null for drafts, archived stories, and unknown slugs. */
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  if (isDemoMode()) return demo.demoPostBySlug(slug);
  return withRls(null, async (tx) => {
    const [row] = await summaryQuery(tx)
      .where(and(eq(posts.slug, slug), eq(posts.status, PUBLISHED)))
      .limit(1);
    if (!row) return null;
    return { ...toSummary(row), blocks: await loadBlocks(tx, row.id) };
  });
}

export async function getRelatedPosts(post: PostSummary, limit = 3): Promise<PostSummary[]> {
  if (isDemoMode()) return demo.demoRelatedPosts(post, limit);
  if (!post.category) return [];
  const categorySlug = post.category.slug;
  const rows = await withRls(null, (tx) =>
    summaryQuery(tx)
      .where(
        and(eq(posts.status, PUBLISHED), eq(categories.slug, categorySlug), ne(posts.id, post.id)),
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit),
  );
  return rows.map(toSummary);
}

export async function getCategories(): Promise<Category[]> {
  if (isDemoMode()) return [...getDemoState().categories].sort((a, b) => a.name.localeCompare(b.name));
  return withRls(null, (tx) =>
    tx
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        parentId: categories.parentId,
      })
      .from(categories)
      .orderBy(asc(categories.name)),
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (isDemoMode()) return getDemoState().categories.find((category) => category.slug === slug) ?? null;
  const [row] = await withRls(null, (tx) =>
    tx.select().from(categories).where(eq(categories.slug, slug)).limit(1),
  );
  return row ?? null;
}

/** Every category with its own published story count. Use buildCategoryTree to roll counts up to sections. */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  if (isDemoMode()) return demo.demoCategoriesWithCounts();
  return withRls(null, (tx) =>
    tx
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        parentId: categories.parentId,
        postCount: count(posts.id),
      })
      .from(categories)
      .leftJoin(posts, and(eq(posts.categoryId, categories.id), eq(posts.status, PUBLISHED)))
      .groupBy(categories.id)
      .orderBy(asc(categories.name)),
  );
}

export async function getAuthorByUsername(username: string): Promise<AuthorProfile | null> {
  if (isDemoMode()) return demo.demoAuthorByUsername(username);
  const [row] = await withRls(null, (tx) =>
    tx.select().from(publicProfiles).where(eq(publicProfiles.username, username)).limit(1),
  );
  if (!row) return null;
  return { ...row, role: row.role as Role, status: row.status as ProfileStatus };
}

/** Active newsroom members for the About page, from the public profile view. */
export async function getTeam(): Promise<AuthorProfile[]> {
  if (isDemoMode()) {
    return getDemoState()
      .profiles.filter((profile) => profile.status === "ACTIVE" && profile.role === "ADMIN")
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((profile) => demo.demoAuthorByUsername(profile.username))
      .filter((profile): profile is AuthorProfile => profile !== null);
  }
  const rows = await withRls(null, (tx) =>
    tx
      .select()
      .from(publicProfiles)
      .where(and(eq(publicProfiles.status, "ACTIVE"), eq(publicProfiles.role, "ADMIN")))
      .orderBy(asc(publicProfiles.displayName)),
  );
  return rows.map((row) => ({ ...row, role: row.role as Role, status: row.status as ProfileStatus }));
}

/** Every admin profile, active or suspended, for the public Admins page. */
export async function getAdminProfiles(): Promise<AuthorProfile[]> {
  if (isDemoMode()) {
    return getDemoState()
      .profiles.filter((profile) => profile.role === "ADMIN" && profile.status !== "ARCHIVED")
      .map((profile) => demo.demoAuthorByUsername(profile.username))
      .filter((profile): profile is AuthorProfile => profile !== null);
  }
  const rows = await withRls(null, (tx) =>
    tx
      .select()
      .from(publicProfiles)
      .where(and(eq(publicProfiles.role, "ADMIN"), ne(publicProfiles.status, "ARCHIVED"))),
  );
  return rows.map((row) => ({ ...row, role: row.role as Role, status: row.status as ProfileStatus }));
}

export async function getPostsByAuthor(authorId: string): Promise<PostSummary[]> {
  if (isDemoMode()) return demo.demoPostsByAuthor(authorId);
  const rows = await withRls(null, (tx) =>
    summaryQuery(tx)
      .where(and(eq(posts.status, PUBLISHED), eq(posts.authorId, authorId)))
      .orderBy(desc(posts.publishedAt)),
  );
  return rows.map(toSummary);
}

/** Videos (uploaded or YouTube) embedded in published stories, newest story first. */
export async function getVideoItems(
  options: { kind?: "uploaded" | "youtube"; authorId?: string; limit?: number } = {},
): Promise<VideoItem[]> {
  if (isDemoMode()) return demo.demoVideoItems(options);
  const types = options.kind === "uploaded" ? ["video"] : options.kind === "youtube" ? ["youtube"] : ["video", "youtube"];

  return withRls(null, async (tx): Promise<VideoItem[]> => {
    const blockRows = await tx
      .select({
        id: postBlocks.id,
        postId: postBlocks.postId,
        type: postBlocks.type,
        payload: postBlocks.payload,
      })
      .from(postBlocks)
      .innerJoin(posts, eq(postBlocks.postId, posts.id))
      .where(
        and(
          eq(posts.status, PUBLISHED),
          inArray(postBlocks.type, types),
          options.authorId ? eq(posts.authorId, options.authorId) : undefined,
        ),
      )
      .orderBy(desc(posts.publishedAt), asc(postBlocks.position))
      .limit(options.limit ?? 60);
    if (blockRows.length === 0) return [];

    const postIds = [...new Set(blockRows.map((row) => row.postId))];
    const summaries = new Map(
      (await summaryQuery(tx).where(inArray(posts.id, postIds))).map((row) => [row.id, toSummary(row)]),
    );

    return blockRows.flatMap((row): VideoItem[] => {
      const block = rowToBlock(row.type, row.payload);
      const post = summaries.get(row.postId);
      if (!block || !post || (block.type !== "video" && block.type !== "youtube")) return [];
      return [
        {
          id: row.id,
          kind: block.type === "video" ? "uploaded" : "youtube",
          title: block.title || post.title,
          videoId: block.type === "youtube" ? block.videoId : null,
          post,
        },
      ];
    });
  });
}

/** Real counts for the "By the numbers" section. Zero when empty. */
export async function getSiteStats(): Promise<SiteStats> {
  if (isDemoMode()) return demo.demoSiteStats();
  return withRls(null, async (tx) => {
    const [{ value: publishedStories }] = await tx
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.status, PUBLISHED));
    const [{ value: categoryCount }] = await tx.select({ value: count() }).from(categories);
    const [{ value: activeContributors }] = await tx
      .select({ value: countDistinct(posts.authorId) })
      .from(posts)
      .innerJoin(publicProfiles, eq(posts.authorId, publicProfiles.id))
      .where(and(eq(posts.status, PUBLISHED), eq(publicProfiles.status, "ACTIVE")));
    const [{ value: videos }] = await tx
      .select({ value: count() })
      .from(postBlocks)
      .innerJoin(posts, eq(postBlocks.postId, posts.id))
      .where(and(eq(posts.status, PUBLISHED), inArray(postBlocks.type, ["video", "youtube"])));
    return { publishedStories, categories: categoryCount, activeContributors, videos };
  });
}
