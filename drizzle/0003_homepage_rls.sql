-- Custom SQL migration: privileges and Row Level Security for homepage_slots.
-- Everyone may read which stories are pinned (the posts policies still hide anything
-- that is not PUBLISHED). Only an ACTIVE SUPER_ADMIN may change the pins.

revoke all on public.homepage_slots from anon, authenticated;
--> statement-breakpoint
grant select on public.homepage_slots to anon, authenticated;
--> statement-breakpoint
grant insert, update, delete on public.homepage_slots to authenticated;
--> statement-breakpoint
alter table public.homepage_slots enable row level security;
--> statement-breakpoint
create policy homepage_slots_select_all on public.homepage_slots
  for select to anon, authenticated using (true);
--> statement-breakpoint
create policy homepage_slots_insert_super on public.homepage_slots
  for insert to authenticated
  with check ((select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint
create policy homepage_slots_update_super on public.homepage_slots
  for update to authenticated
  using ((select public.current_role_name()) = 'SUPER_ADMIN')
  with check ((select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint
create policy homepage_slots_delete_super on public.homepage_slots
  for delete to authenticated
  using ((select public.current_role_name()) = 'SUPER_ADMIN');
