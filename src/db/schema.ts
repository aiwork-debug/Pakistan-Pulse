import { sql } from "drizzle-orm";
import {
  bigserial,
  check,
  index,
  type AnyPgColumn,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/** Preset key stored in gradient columns. Mapped to Tailwind classes in src/lib/gradients.ts. */
export const DEFAULT_GRADIENT = "teal";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    bio: text("bio").notNull().default(""),
    avatarGradient: text("avatar_gradient").notNull().default(DEFAULT_GRADIENT),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("profiles_role_check", sql`${t.role} in ('ADMIN', 'SUPER_ADMIN')`),
    check("profiles_status_check", sql`${t.status} in ('ACTIVE', 'SUSPENDED', 'ARCHIVED')`),
    check("profiles_username_check", sql`${t.username} ~ '^[a-z0-9-]{3,30}$'`),
  ],
);

/**
 * Sections and subcategories. A row with parent_id is a subcategory of that row. The app
 * keeps the tree two levels deep: a subcategory's parent is always a top-level section.
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
  },
  (t) => [
    index("categories_parent_idx").on(t.parentId),
    check("categories_parent_not_self_check", sql`${t.parentId} is null or ${t.parentId} <> ${t.id}`),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    // Drafts may be saved before the dek is written, so the 10-character minimum
    // applies once a post is PUBLISHED (see posts_dek_check).
    dek: text("dek").notNull().default(""),
    categoryId: uuid("category_id").references(() => categories.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    status: text("status").notNull().default("DRAFT"),
    // Fallback shown only when a story has no cover image (older rows, drafts).
    coverGradient: text("cover_gradient").notNull().default(DEFAULT_GRADIENT),
    // Public URL of the uploaded cover photo. Required once a post is PUBLISHED.
    coverImageUrl: text("cover_image_url"),
    coverAlt: text("cover_alt").notNull().default(""),
    readMinutes: integer("read_minutes").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("posts_status_check", sql`${t.status} in ('DRAFT', 'PUBLISHED', 'ARCHIVED')`),
    check("posts_title_check", sql`char_length(${t.title}) between 5 and 160`),
    check(
      "posts_dek_check",
      sql`char_length(${t.dek}) <= 300 and (${t.status} <> 'PUBLISHED' or char_length(${t.dek}) >= 10)`,
    ),
    check("posts_slug_check", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("posts_read_minutes_check", sql`${t.readMinutes} between 1 and 240`),
    check(
      "posts_cover_check",
      sql`char_length(${t.coverAlt}) <= 300 and (${t.status} <> 'PUBLISHED' or (${t.coverImageUrl} is not null and char_length(${t.coverAlt}) > 0))`,
    ),
    index("posts_status_published_idx").on(t.status, t.publishedAt.desc()),
    index("posts_author_idx").on(t.authorId),
    index("posts_category_idx").on(t.categoryId),
  ],
);

/**
 * Stories a super admin has pinned to the homepage. Slot 1 is the hero and slots 2-5 are
 * the top stories (HOMEPAGE_SLOTS in src/lib/homepage.ts). An empty slot is filled automatically
 * with the newest published story. Only PUBLISHED posts are shown publicly, so a pinned
 * story that is unpublished or archived simply drops out until it is live again.
 */
export const homepageSlots = pgTable(
  "homepage_slots",
  {
    slot: integer("slot").primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .unique()
      .references(() => posts.id, { onDelete: "cascade" }),
    updatedBy: uuid("updated_by").references(() => profiles.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("homepage_slots_slot_check", sql`${t.slot} between 1 and 5`)],
);

export const postBlocks = pgTable(
  "post_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (t) => [
    unique("post_blocks_post_position_key").on(t.postId, t.position),
    check(
      "post_blocks_type_check",
      sql`${t.type} in ('paragraph', 'heading', 'quote', 'image', 'youtube', 'tweet', 'video')`,
    ),
  ],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    uploaderId: uuid("uploader_id")
      .notNull()
      .references(() => profiles.id),
    storagePath: text("storage_path").notNull(),
    publicUrl: text("public_url").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    altText: text("alt_text").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Soft delete: the row and file are kept for the audit trail.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("media_uploader_idx").on(t.uploaderId)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id").references(() => profiles.id),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_action_created_idx").on(t.action, t.createdAt.desc())],
);
