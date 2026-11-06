-- Custom SQL migration: Row Level Security, helper functions, triggers, the public
-- profile view, the media storage bucket and its policies, and the six categories.
-- Every statement ends with a statement-breakpoint so drizzle-kit runs them one by one.

-- ---------------------------------------------------------------------------
-- Helper: role of the signed-in user (only while their profile is ACTIVE).
-- security definer + pinned search_path so it can read profiles without recursing
-- into the profiles policies.
-- ---------------------------------------------------------------------------
create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'ACTIVE'
$$;
--> statement-breakpoint
revoke all on function public.current_role_name() from public;
--> statement-breakpoint
grant execute on function public.current_role_name() to anon, authenticated, service_role;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- posts: updated_at on every update; published_at set on first publish and never cleared.
-- author_id and created_at cannot be changed after insert.
-- ---------------------------------------------------------------------------
create or replace function public.posts_set_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.created_at := old.created_at;
    new.author_id := old.author_id;
    if old.published_at is not null then
      new.published_at := old.published_at;
    elsif new.status <> 'PUBLISHED' then
      new.published_at := null;
    end if;
  elsif new.status <> 'PUBLISHED' then
    new.published_at := null;
  end if;

  if new.status = 'PUBLISHED' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
--> statement-breakpoint
drop trigger if exists posts_set_timestamps on public.posts;
--> statement-breakpoint
create trigger posts_set_timestamps
  before insert or update on public.posts
  for each row execute function public.posts_set_timestamps();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- profiles: only a SUPER_ADMIN may change role or status; nobody changes id or username
-- through the API. Privileged connections (no auth.uid(), e.g. the service role or the
-- create-super-admin script) are not restricted.
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.id is distinct from old.id or new.username is distinct from old.username then
    raise exception 'id and username cannot be changed' using errcode = '42501';
  end if;
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and public.current_role_name() is distinct from 'SUPER_ADMIN' then
    raise exception 'only a super admin can change role or status' using errcode = '42501';
  end if;
  return new;
end;
$$;
--> statement-breakpoint
drop trigger if exists profiles_guard on public.profiles;
--> statement-breakpoint
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Table privileges. RLS decides which rows; grants decide which operations exist at all.
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.categories, public.posts, public.post_blocks, public.media, public.audit_log
  from anon, authenticated;
--> statement-breakpoint
grant select on public.categories, public.posts, public.post_blocks, public.media to anon;
--> statement-breakpoint
grant select, insert, update, delete on public.categories to authenticated;
--> statement-breakpoint
grant select, insert, update on public.posts to authenticated;
--> statement-breakpoint
grant select, insert, update, delete on public.post_blocks to authenticated;
--> statement-breakpoint
grant select, insert, update, delete on public.media to authenticated;
--> statement-breakpoint
grant select, insert on public.profiles to authenticated;
--> statement-breakpoint
grant update (display_name, bio, role, status) on public.profiles to authenticated;
--> statement-breakpoint
grant select, insert on public.audit_log to authenticated;
--> statement-breakpoint
grant usage, select on sequence public.audit_log_id_seq to authenticated;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Enable RLS on every table.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
--> statement-breakpoint
alter table public.categories enable row level security;
--> statement-breakpoint
alter table public.posts enable row level security;
--> statement-breakpoint
alter table public.post_blocks enable row level security;
--> statement-breakpoint
alter table public.media enable row level security;
--> statement-breakpoint
alter table public.audit_log enable row level security;
--> statement-breakpoint

-- categories ---------------------------------------------------------------
create policy categories_select_all on public.categories
  for select to anon, authenticated using (true);
--> statement-breakpoint
create policy categories_insert_super on public.categories
  for insert to authenticated
  with check ((select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint
create policy categories_update_super on public.categories
  for update to authenticated
  using ((select public.current_role_name()) = 'SUPER_ADMIN')
  with check ((select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint
create policy categories_delete_super on public.categories
  for delete to authenticated
  using ((select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint

-- posts --------------------------------------------------------------------
-- Everyone reads PUBLISHED. Staff also read their own posts in any status.
-- SUPER_ADMIN reads everything. No delete policy: posts are archived, not deleted.
create policy posts_select on public.posts
  for select to anon, authenticated
  using (
    status = 'PUBLISHED'
    or (
      author_id = (select auth.uid())
      and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN')
    )
    or (select public.current_role_name()) = 'SUPER_ADMIN'
  );
--> statement-breakpoint
create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN')
  );
--> statement-breakpoint
create policy posts_update_own_or_super on public.posts
  for update to authenticated
  using (
    (author_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
    or (select public.current_role_name()) = 'SUPER_ADMIN'
  )
  with check (
    (author_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
    or (select public.current_role_name()) = 'SUPER_ADMIN'
  );
--> statement-breakpoint

-- post_blocks --------------------------------------------------------------
-- The subquery on posts is itself filtered by the posts policies, so blocks are visible
-- exactly when their parent post is.
create policy post_blocks_select on public.post_blocks
  for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_blocks.post_id));
--> statement-breakpoint
create policy post_blocks_insert on public.post_blocks
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_blocks.post_id
        and (
          (p.author_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
          or (select public.current_role_name()) = 'SUPER_ADMIN'
        )
    )
  );
--> statement-breakpoint
create policy post_blocks_update on public.post_blocks
  for update to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_blocks.post_id
        and (
          (p.author_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
          or (select public.current_role_name()) = 'SUPER_ADMIN'
        )
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_blocks.post_id
        and (
          (p.author_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
          or (select public.current_role_name()) = 'SUPER_ADMIN'
        )
    )
  );
--> statement-breakpoint
create policy post_blocks_delete on public.post_blocks
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_blocks.post_id
        and (
          (p.author_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
          or (select public.current_role_name()) = 'SUPER_ADMIN'
        )
    )
  );
--> statement-breakpoint

-- profiles -----------------------------------------------------------------
-- The base table is private: a user reads their own row; SUPER_ADMIN reads all.
-- Public pages use the public_profiles view below, which exposes no email or private data.
create policy profiles_select_own_or_super on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint
create policy profiles_insert_super on public.profiles
  for insert to authenticated
  with check ((select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint
-- Users update their own display_name and bio (column grants + profiles_guard block the rest).
-- SUPER_ADMIN may also change status and role, through the admin server actions.
create policy profiles_update_own_or_super on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.current_role_name()) = 'SUPER_ADMIN')
  with check (id = (select auth.uid()) or (select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint

create or replace view public.public_profiles
  with (security_barrier = true)
  as
  select id, username, display_name, bio, avatar_gradient, role, status
  from public.profiles;
--> statement-breakpoint
-- Read-only: revoke the default grants so the view can never be used to write.
revoke all on public.public_profiles from public, anon, authenticated;
--> statement-breakpoint
grant select on public.public_profiles to anon, authenticated;
--> statement-breakpoint

-- media --------------------------------------------------------------------
create policy media_select on public.media
  for select to anon, authenticated
  using (
    deleted_at is null
    or uploader_id = (select auth.uid())
    or (select public.current_role_name()) = 'SUPER_ADMIN'
  );
--> statement-breakpoint
create policy media_insert_staff on public.media
  for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN')
  );
--> statement-breakpoint
-- Used for alt text edits and soft deletes (deleted_at).
create policy media_update_owner_or_super on public.media
  for update to authenticated
  using (
    (uploader_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
    or (select public.current_role_name()) = 'SUPER_ADMIN'
  )
  with check (
    (uploader_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
    or (select public.current_role_name()) = 'SUPER_ADMIN'
  );
--> statement-breakpoint
create policy media_delete_owner_or_super on public.media
  for delete to authenticated
  using (
    (uploader_id = (select auth.uid()) and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN'))
    or (select public.current_role_name()) = 'SUPER_ADMIN'
  );
--> statement-breakpoint

-- audit_log: append-only ---------------------------------------------------
-- Insert: staff writing their own actions (the service role bypasses RLS).
-- Select: SUPER_ADMIN only. No update or delete policy exists for any role.
create policy audit_log_insert_own on public.audit_log
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN')
  );
--> statement-breakpoint
create policy audit_log_select_super on public.audit_log
  for select to authenticated
  using ((select public.current_role_name()) = 'SUPER_ADMIN');
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Storage: public `media` bucket. Files live under {uid}/{yyyy}/{mm}/{uuid}.{ext}.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
--> statement-breakpoint
drop policy if exists media_bucket_read on storage.objects;
--> statement-breakpoint
create policy media_bucket_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');
--> statement-breakpoint
drop policy if exists media_bucket_insert_own_folder on storage.objects;
--> statement-breakpoint
create policy media_bucket_insert_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.current_role_name()) in ('ADMIN', 'SUPER_ADMIN')
  );
--> statement-breakpoint
drop policy if exists media_bucket_delete_owner_or_super on storage.objects;
--> statement-breakpoint
create policy media_bucket_delete_owner_or_super on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.current_role_name()) = 'SUPER_ADMIN'
    )
  );
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- The six categories (idempotent; supabase/seed.sql does the same).
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, description) values
  ('economy', 'Economy', 'Household budgets, prices, jobs, and the policies that shape them.'),
  ('cities', 'Cities', 'Transport, housing, public space, and how our cities are run.'),
  ('technology', 'Technology', 'How digital tools change work, money, and public information.'),
  ('environment', 'Environment', 'Climate, water, energy, and the communities living with change.'),
  ('education', 'Education', 'Schools, teachers, and the families navigating the system.'),
  ('sports', 'Sports', 'Grassroots leagues, local clubs, and the people who keep them going.')
on conflict (slug) do nothing;
