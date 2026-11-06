import { pgSchema, pgView, text, timestamp, uuid } from "drizzle-orm/pg-core";

/*
 * Objects that exist in the database but are NOT managed by drizzle-kit:
 * - auth.users belongs to Supabase Auth.
 * - public_profiles is created by the RLS migration (drizzle/0001_rls_policies.sql).
 * This file is deliberately outside drizzle.config.ts `schema`, so migrations never touch them.
 */

const auth = pgSchema("auth");

export const authUsersFull = auth.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
});

/** Public, email-free view of staff profiles used by author pages and bylines. */
export const publicProfiles = pgView("public_profiles", {
  id: uuid("id").notNull(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio").notNull(),
  avatarGradient: text("avatar_gradient").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
}).existing();
