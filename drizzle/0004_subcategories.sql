ALTER TABLE "categories" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_not_self_check" CHECK ("categories"."parent_id" is null or "categories"."parent_id" <> "categories"."id");--> statement-breakpoint
-- Politics section and the subcategories of every section (idempotent; supabase/seed.sql does the same).
insert into public.categories (slug, name, description) values
  ('politics', 'Politics', 'Parliament, elections, government, and the decisions made in the country''s name.')
on conflict (slug) do nothing;--> statement-breakpoint
insert into public.categories (slug, name, description, parent_id)
select child.slug, child.name, child.description, parent.id
from (values
  ('national-politics', 'National', 'Government, opposition, and the parties shaping the national debate.', 'politics'),
  ('elections', 'Elections', 'Campaigns, voting, results, and the rules that govern them.', 'politics'),
  ('parliament', 'Parliament', 'Debates, bills, and votes in the national and provincial assemblies.', 'politics'),
  ('diplomacy', 'Diplomacy', 'Foreign policy, regional ties, and international agreements.', 'politics'),
  ('budget-and-tax', 'Budget & Tax', 'Public finances, tax changes, and where the money goes.', 'economy'),
  ('business', 'Business', 'Companies, traders, credit, and the people who run small firms.', 'economy'),
  ('transport', 'Transport', 'Buses, roads, and how people get around the city.', 'cities'),
  ('housing', 'Housing', 'Rents, permits, and the homes being built or held back.', 'cities'),
  ('online-safety', 'Online Safety', 'Scams, privacy, and staying safe on everyday apps.', 'technology'),
  ('open-data', 'Open Data', 'Public records, datasets, and the people who make sense of them.', 'technology'),
  ('climate', 'Climate', 'Heat, floods, and how communities adapt to a changing climate.', 'environment'),
  ('green-spaces', 'Green Spaces', 'Parks, trees, and the public spaces that keep cities liveable.', 'environment'),
  ('schools', 'Schools', 'Classrooms, enrolment, and the families navigating the school system.', 'education'),
  ('learning', 'Learning', 'Libraries, tutoring, and learning outside the classroom.', 'education'),
  ('cricket', 'Cricket', 'Club fixtures, community leagues, and the grounds that host them.', 'sports'),
  ('football', 'Football', 'Leagues, academies, and the growing women''s game.', 'sports')
) as child(slug, name, description, parent_slug)
join public.categories parent on parent.slug = child.parent_slug
on conflict (slug) do nothing;
