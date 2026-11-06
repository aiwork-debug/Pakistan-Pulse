CREATE TABLE "homepage_slots" (
	"slot" integer PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "homepage_slots_post_id_unique" UNIQUE("post_id"),
	CONSTRAINT "homepage_slots_slot_check" CHECK ("homepage_slots"."slot" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "cover_alt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "homepage_slots" ADD CONSTRAINT "homepage_slots_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_slots" ADD CONSTRAINT "homepage_slots_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_check" CHECK (char_length("posts"."cover_alt") <= 300 and ("posts"."status" <> 'PUBLISHED' or ("posts"."cover_image_url" is not null and char_length("posts"."cover_alt") > 0)));