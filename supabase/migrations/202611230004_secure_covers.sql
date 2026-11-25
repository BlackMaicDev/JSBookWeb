-- Restore restricted content access after the earlier demo-wide policies.
-- Existing profile roles must be reviewed manually; this migration does not guess
-- which previously promoted accounts should remain editors or admins.

begin;

drop policy if exists allow_all_books on public.books;
drop policy if exists allow_all_reviews on public.reviews;
drop policy if exists allow_all_shelf on public.genre_shelf_items;
drop policy if exists allow_all_blog on public.blog_posts;

revoke all on public.profiles, public.books, public.reviews,
  public.genre_shelf_items, public.blog_posts from public, anon, authenticated;
grant select on public.profiles, public.books, public.reviews,
  public.genre_shelf_items, public.blog_posts to anon, authenticated;
grant update (display_name, avatar_path, bio) on public.profiles to authenticated;
grant insert, update, delete on public.books, public.reviews,
  public.genre_shelf_items, public.blog_posts to authenticated;

-- The editor may publish while creating a review or post. RLS still checks
-- ownership and role; public SELECT policies only expose published content.
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert to authenticated
with check (author_id = (select auth.uid()) and status in ('draft', 'published') and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));

drop policy if exists blog_posts_insert on public.blog_posts;
create policy blog_posts_insert on public.blog_posts for insert to authenticated
with check (author_id = (select auth.uid()) and status in ('draft', 'published') and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));

-- New signups are readers. Grant editor/admin only from a trusted SQL session.
drop trigger if exists trigger_auto_confirm_new_user on auth.users;
drop function if exists public.auto_confirm_new_user();
create or replace function public.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), 'ผู้อ่าน'),
    'reader'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 5242880, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists book_covers_editor_insert on storage.objects;
drop policy if exists book_covers_editor_select on storage.objects;
drop policy if exists book_covers_editor_delete on storage.objects;

create policy book_covers_editor_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'book-covers'
  and name ~* '^books/[a-f0-9-]+\.(webp|png|jpe?g)$'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin'))
);
create policy book_covers_editor_select on storage.objects for select to authenticated
using (bucket_id = 'book-covers' and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));
create policy book_covers_editor_delete on storage.objects for delete to authenticated
using (bucket_id = 'book-covers' and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));

commit;
