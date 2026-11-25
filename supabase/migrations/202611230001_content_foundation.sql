-- Family JS content foundation. Apply with Supabase migrations after creating a project.
-- The existing visual themes remain in code; this stores content and shelf placement.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'ผู้อ่าน',
  avatar_path text,
  bio text,
  role text not null default 'reader' check (role in ('reader', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.genres (
  slug text primary key,
  name text not null,
  sort_order integer not null unique
);

insert into public.genres (slug, name, sort_order) values
  ('crime', 'สืบสวน & ระทึกขวัญ', 1),
  ('classics', 'วรรณกรรมคลาสสิก', 2),
  ('wuxia', 'กำลังภายใน', 3),
  ('romance', 'โรแมนซ์', 4),
  ('manga', 'มังงะ', 5);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  english_title text,
  author text not null,
  translator text,
  publisher text,
  isbn text unique,
  page_count integer check (page_count > 0),
  cover_path text, -- nullable: the existing illustrated cover is the fallback
  synopsis text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  content text not null default '',
  highlight_quote text,
  tags text[] not null default '{}',
  rating numeric(2,1) not null check (rating between 1 and 5 and rating * 2 = trunc(rating * 2)),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A placement selects a published review for a themed shelf. UI theme settings
-- and book-opening animations stay in the application, not in the database.
create table public.genre_shelf_items (
  genre_slug text not null references public.genres (slug) on delete cascade,
  review_id uuid not null references public.reviews (id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  is_spotlight boolean not null default false,
  code text not null default '',
  stamp_text text not null default '',
  stamp_variant text not null default 'amber' check (stamp_variant in ('crimson', 'amber', 'cyan', 'emerald', 'purple')),
  cover_style text not null default '',
  metrics jsonb not null default '{"m1":0,"m2":0,"m3":0,"m4":0}'::jsonb,
  primary key (genre_slug, review_id),
  unique (genre_slug, sort_order)
);

create unique index genre_one_spotlight on public.genre_shelf_items (genre_slug) where is_spotlight;

-- General stories do not require a book.
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id),
  slug text not null unique,
  category text not null,
  title text not null,
  excerpt text not null default '',
  quote text,
  art_key text,
  sections jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_published on public.reviews (published_at desc) where status = 'published';
create index blog_posts_published on public.blog_posts (published_at desc) where status = 'published';
create index shelf_order on public.genre_shelf_items (genre_slug, sort_order);

create function public.set_content_timestamps() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger reviews_timestamps before insert or update on public.reviews
for each row execute function public.set_content_timestamps();
create trigger blog_posts_timestamps before insert or update on public.blog_posts
for each row execute function public.set_content_timestamps();

create function public.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'ผู้อ่าน'));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_user();

alter table public.profiles enable row level security;
alter table public.genres enable row level security;
alter table public.books enable row level security;
alter table public.reviews enable row level security;
alter table public.genre_shelf_items enable row level security;
alter table public.blog_posts enable row level security;

-- RLS protects rows. Explicit grants limit which operations can reach each policy.
-- A signed-in user may edit profile text, but never the role column.
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (display_name, avatar_path, bio) on public.profiles to authenticated;

revoke all on public.genres, public.books, public.reviews,
  public.genre_shelf_items, public.blog_posts from public, anon, authenticated;
grant select on public.genres, public.books, public.reviews,
  public.genre_shelf_items, public.blog_posts to anon, authenticated;
grant insert, update, delete on public.genres, public.books, public.reviews,
  public.genre_shelf_items, public.blog_posts to authenticated;

create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy genres_read on public.genres for select to anon, authenticated using (true);
create policy genres_admin on public.genres for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy books_read on public.books for select to anon, authenticated using (true);
create policy books_edit on public.books for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));

create policy reviews_read on public.reviews for select to anon, authenticated
using (status = 'published' or author_id = (select auth.uid()) or
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy reviews_insert on public.reviews for insert to authenticated
with check (author_id = (select auth.uid()) and status = 'draft' and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));
create policy reviews_update_own on public.reviews for update to authenticated
using (author_id = (select auth.uid()) and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')))
with check (author_id = (select auth.uid()) and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));
create policy reviews_admin on public.reviews for update to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy reviews_delete_admin on public.reviews for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy shelf_read on public.genre_shelf_items for select to anon, authenticated
using (exists (select 1 from public.reviews r where r.id = review_id and r.status = 'published') or
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));
create policy shelf_edit on public.genre_shelf_items for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));

create policy blog_posts_read on public.blog_posts for select to anon, authenticated
using (status = 'published' or author_id = (select auth.uid()) or
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy blog_posts_insert on public.blog_posts for insert to authenticated
with check (author_id = (select auth.uid()) and status = 'draft' and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));
create policy blog_posts_update_own on public.blog_posts for update to authenticated
using (author_id = (select auth.uid()) and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')))
with check (author_id = (select auth.uid()) and
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));
create policy blog_posts_admin on public.blog_posts for update to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy blog_posts_delete_admin on public.blog_posts for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
