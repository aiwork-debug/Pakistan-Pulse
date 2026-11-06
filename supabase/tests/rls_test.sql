-- RLS tests for Pulse. Run the whole file in the Supabase SQL editor (it runs as postgres).
-- Everything happens in one transaction and is rolled back at the end, so no data is kept.
-- Each check raises an exception on failure. A clean run ends with "ROLLBACK" and the
-- PASS notices in the output.

begin;

-- Fixtures ------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'rls-super@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', 'rls-admin-a@example.com'),
  ('00000000-0000-4000-8000-0000000000a3', 'rls-admin-b@example.com');

insert into public.profiles (id, username, display_name, role, status) values
  ('00000000-0000-4000-8000-0000000000a1', 'rls-super', 'RLS Super', 'SUPER_ADMIN', 'ACTIVE'),
  ('00000000-0000-4000-8000-0000000000a2', 'rls-admin-a', 'RLS Admin A', 'ADMIN', 'ACTIVE'),
  ('00000000-0000-4000-8000-0000000000a3', 'rls-admin-b', 'RLS Admin B', 'ADMIN', 'ACTIVE');

insert into public.posts (id, slug, title, dek, author_id, status, cover_image_url, cover_alt) values
  ('00000000-0000-4000-8000-0000000000b1', 'rls-a-published', 'A published story', 'Published by admin A for tests.', '00000000-0000-4000-8000-0000000000a2', 'PUBLISHED', 'https://example.com/cover.jpg', 'A test cover'),
  ('00000000-0000-4000-8000-0000000000b2', 'rls-a-draft', 'A draft story', '', '00000000-0000-4000-8000-0000000000a2', 'DRAFT', null, ''),
  ('00000000-0000-4000-8000-0000000000b3', 'rls-b-draft', 'B draft story', '', '00000000-0000-4000-8000-0000000000a3', 'DRAFT', null, '');

insert into public.post_blocks (post_id, position, type, payload) values
  ('00000000-0000-4000-8000-0000000000b1', 0, 'paragraph', '{"text":"public"}'),
  ('00000000-0000-4000-8000-0000000000b2', 0, 'paragraph', '{"text":"secret A"}'),
  ('00000000-0000-4000-8000-0000000000b3', 0, 'paragraph', '{"text":"secret B"}');

insert into public.audit_log (actor_id, action, target_type, target_id) values
  ('00000000-0000-4000-8000-0000000000a1', 'TEST', 'post', 'x');

-- Reader (anon) ---------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  if (select count(*) from public.posts where slug like 'rls-%' and status <> 'PUBLISHED') <> 0 then
    raise exception 'FAIL reader: can read drafts';
  end if;
  if (select count(*) from public.posts where slug = 'rls-a-published') <> 1 then
    raise exception 'FAIL reader: cannot read a published post';
  end if;
  if (select count(*) from public.post_blocks where payload->>'text' like 'secret%') <> 0 then
    raise exception 'FAIL reader: can read draft blocks';
  end if;
  begin
    perform 1 from public.profiles limit 1;
    raise exception 'FAIL reader: can read the profiles table';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.audit_log limit 1;
    raise exception 'FAIL reader: can read audit_log';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.public_profiles where username like 'rls-%') <> 3 then
    raise exception 'FAIL reader: public_profiles not readable';
  end if;
  raise notice 'PASS reader (anon)';
end $$;

reset role;

-- Admin A -------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a2', true);

do $$
declare
  changed int;
begin
  if (select count(*) from public.posts where slug = 'rls-a-draft') <> 1 then
    raise exception 'FAIL admin A: cannot read own draft';
  end if;
  if (select count(*) from public.posts where slug = 'rls-b-draft') <> 0 then
    raise exception 'FAIL admin A: can read another admin''s draft';
  end if;
  if (select count(*) from public.post_blocks where payload->>'text' = 'secret B') <> 0 then
    raise exception 'FAIL admin A: can read another admin''s draft blocks';
  end if;

  update public.posts set title = 'Hijacked title' where slug = 'rls-b-draft';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL admin A: updated another admin''s post'; end if;

  if (select count(*) from public.audit_log) <> 0 then
    raise exception 'FAIL admin A: can read audit_log';
  end if;

  begin
    insert into public.posts (slug, title, author_id) values ('rls-forged', 'Forged author', '00000000-0000-4000-8000-0000000000a3');
    raise exception 'FAIL admin A: inserted a post for another author';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.profiles set status = 'ACTIVE', role = 'SUPER_ADMIN' where id = '00000000-0000-4000-8000-0000000000a2';
    raise exception 'FAIL admin A: changed own role';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.audit_log set action = 'EDITED';
    raise exception 'FAIL admin A: updated audit_log';
  exception when insufficient_privilege then null;
  end;

  -- Admins cannot pin stories to the homepage; only a super admin can.
  begin
    insert into public.homepage_slots (slot, post_id) values (1, '00000000-0000-4000-8000-0000000000b1');
    raise exception 'FAIL admin A: pinned a story to the homepage';
  exception when insufficient_privilege then null;
  end;

  -- A story cannot go live without a cover image.
  begin
    update public.posts set status = 'PUBLISHED', dek = 'Now published by admin A.' where slug = 'rls-a-draft';
    raise exception 'FAIL check: published a story without a cover image';
  exception when check_violation then null;
  end;

  -- Admins publish their own posts directly. No approval needed.
  update public.posts
    set status = 'PUBLISHED', dek = 'Now published by admin A.',
        cover_image_url = 'https://example.com/cover-2.jpg', cover_alt = 'Another test cover'
    where slug = 'rls-a-draft';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL admin A: cannot publish own draft'; end if;
  if (select published_at from public.posts where slug = 'rls-a-draft') is null then
    raise exception 'FAIL trigger: published_at not set on first publish';
  end if;

  raise notice 'PASS admin A';
end $$;

reset role;

-- Super admin ---------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);

do $$
declare
  changed int;
begin
  if (select count(*) from public.posts where slug = 'rls-b-draft') <> 1 then
    raise exception 'FAIL super admin: cannot read drafts';
  end if;
  if (select count(*) from public.audit_log where action = 'TEST') <> 1 then
    raise exception 'FAIL super admin: cannot read audit_log';
  end if;

  update public.profiles set status = 'SUSPENDED' where id = '00000000-0000-4000-8000-0000000000a3';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL super admin: cannot suspend an admin'; end if;

  begin
    delete from public.audit_log;
    raise exception 'FAIL super admin: deleted from audit_log';
  exception when insufficient_privilege then null;
  end;

  -- The super admin decides which stories lead the homepage.
  insert into public.homepage_slots (slot, post_id, updated_by)
    values (1, '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1');
  if (select count(*) from public.homepage_slots where slot = 1) <> 1 then
    raise exception 'FAIL super admin: cannot pin a story to the homepage';
  end if;

  raise notice 'PASS super admin';
end $$;

reset role;

-- Suspended admin B is treated as having no role ------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a3', true);

do $$
declare
  changed int;
begin
  update public.posts set title = 'Edited while suspended' where slug = 'rls-b-draft';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL suspended admin: can still edit posts'; end if;
  delete from public.homepage_slots;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL suspended admin: changed the homepage'; end if;
  raise notice 'PASS suspended admin';
end $$;

reset role;

-- Reader sees the homepage pin ------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  if (select count(*) from public.homepage_slots where slot = 1) <> 1 then
    raise exception 'FAIL reader: cannot read homepage pins';
  end if;
  raise notice 'PASS reader homepage';
end $$;

reset role;

rollback;
