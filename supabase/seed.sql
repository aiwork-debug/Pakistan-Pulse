-- Pulse seed data. Safe to run more than once.
-- Seeds ONLY the sections and their subcategories. No posts, no fake content.

insert into public.categories (slug, name, description) values
  ('economy', 'Economy', 'Household budgets, prices, jobs, and the policies that shape them.'),
  ('cities', 'Cities', 'Transport, housing, public space, and how our cities are run.'),
  ('technology', 'Technology', 'How digital tools change work, money, and public information.'),
  ('environment', 'Environment', 'Climate, water, energy, and the communities living with change.'),
  ('education', 'Education', 'Schools, teachers, and the families navigating the system.'),
  ('sports', 'Sports', 'Grassroots leagues, local clubs, and the people who keep them going.')
on conflict (slug) do nothing;

-- Politics section and the subcategories of every section (drizzle/0004 does the same).
insert into public.categories (slug, name, description) values
  ('politics', 'Politics', 'Parliament, elections, government, and the decisions made in the country''s name.')
on conflict (slug) do nothing;

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

-- Demo super admin placeholder.
-- Super admins are NOT created in SQL, because the account must exist in Supabase Auth
-- with a real password. Create the first one with:
--
--   npm run create-super-admin -- you@example.com "a-long-password" your-username "Your Name"
--
-- That script (scripts/create-super-admin.ts) uses the service role key to create the
-- auth user and insert a profiles row with role = 'SUPER_ADMIN'.
