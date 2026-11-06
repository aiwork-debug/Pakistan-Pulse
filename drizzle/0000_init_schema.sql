CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploader_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "post_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "post_blocks_post_position_key" UNIQUE("post_id","position"),
	CONSTRAINT "post_blocks_type_check" CHECK ("post_blocks"."type" in ('paragraph', 'heading', 'quote', 'image', 'youtube', 'tweet', 'video'))
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"dek" text DEFAULT '' NOT NULL,
	"category_id" uuid,
	"author_id" uuid NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"cover_gradient" text DEFAULT 'teal' NOT NULL,
	"read_minutes" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "posts_status_check" CHECK ("posts"."status" in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
	CONSTRAINT "posts_title_check" CHECK (char_length("posts"."title") between 5 and 160),
	CONSTRAINT "posts_dek_check" CHECK (char_length("posts"."dek") <= 300 and ("posts"."status" <> 'PUBLISHED' or char_length("posts"."dek") >= 10)),
	CONSTRAINT "posts_slug_check" CHECK ("posts"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "posts_read_minutes_check" CHECK ("posts"."read_minutes" between 1 and 240)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_gradient" text DEFAULT 'teal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "profiles_role_check" CHECK ("profiles"."role" in ('ADMIN', 'SUPER_ADMIN')),
	CONSTRAINT "profiles_status_check" CHECK ("profiles"."status" in ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
	CONSTRAINT "profiles_username_check" CHECK ("profiles"."username" ~ '^[a-z0-9-]{3,30}$')
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploader_id_profiles_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_blocks" ADD CONSTRAINT "post_blocks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_action_created_idx" ON "audit_log" USING btree ("action","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_uploader_idx" ON "media" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "posts_status_published_idx" ON "posts" USING btree ("status","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");