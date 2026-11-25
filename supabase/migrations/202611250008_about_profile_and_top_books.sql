-- Migration 008: About Me Profile and Top 10 Favorite Books
begin;

create table if not exists public.about_profile (
  id text primary key default 'main',
  name text not null default 'Dong JS',
  tagline text not null default 'Curator, Reader & Developer',
  avatar_path text,
  headline text not null default 'ยินดีต้อนรับสู่บ้านหนังสือ Family JS',
  bio_intro text not null default 'พื้นที่เล็ก ๆ ของคนชอบอ่าน ที่เชื่อว่าหนังสือทุกเล่มมีเรื่องเล่า และทุกเรื่องเล่ามีเวลาที่เหมาะกับมัน ไม่จำเป็นต้องอ่านจบทุกเล่มในวันเดียว แค่วันนี้มีเวลาเปิดอ่านสักสองสามหน้า ก็เป็นวันที่ดีแล้ว',
  story text not null default 'Family JS เกิดขึ้นจากความตั้งใจง่าย ๆ คือ อยากมีชั้นหนังสือดิจิทัลส่วนตัว ที่ไม่ใช่แค่รายการชื่อหนังสือแห้ง ๆ แต่เป็นที่ที่เราสามารถบันทึกความรู้สึก โควทข้อความที่กระทบใจ และบรรยากาศในวันที่เราได้อ่านหนังสือเล่มนั้นจริง ๆ',
  favorite_quote text not null default 'หนังสือเปิดช้า ๆ ชีวิตก็เช่นกัน — บางครั้งความสุขไม่ได้อยู่ที่การอ่านให้เร็วที่สุด แต่อยู่ที่จังหวะที่เราได้ซึมซับเรื่องราวในแต่ละหน้า',
  quote_author text not null default 'Family JS',
  top_books jsonb not null default '[]'::jsonb,
  contact_email text not null default 'dongjs.dev@gmail.com',
  social_links jsonb not null default '{"goodreads": "", "instagram": "", "facebook": "", "github": ""}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default profile row
insert into public.about_profile (id, name, tagline, headline, bio_intro, story, favorite_quote, quote_author, contact_email)
values (
  'main',
  'Dong JS',
  'Curator, Reader & Developer',
  'ยินดีต้อนรับสู่บ้านหนังสือ Family JS',
  'พื้นที่เล็ก ๆ ของคนชอบอ่าน ที่เชื่อว่าหนังสือทุกเล่มมีเรื่องเล่า และทุกเรื่องเล่ามีเวลาที่เหมาะกับมัน ไม่จำเป็นต้องอ่านจบทุกเล่มในวันเดียว แค่วันนี้มีเวลาเปิดอ่านสักสองสามหน้า ก็เป็นวันที่ดีแล้ว',
  'Family JS เกิดขึ้นจากความตั้งใจง่าย ๆ คือ อยากมีชั้นหนังสือดิจิทัลส่วนตัว ที่ไม่ใช่แค่รายการชื่อหนังสือแห้ง ๆ แต่เป็นที่ที่เราสามารถบันทึกความรู้สึก โควทข้อความที่กระทบใจ และบรรยากาศในวันที่เราได้อ่านหนังสือเล่มนั้นจริง ๆ',
  'หนังสือเปิดช้า ๆ ชีวิตก็เช่นกัน — บางครั้งความสุขไม่ได้อยู่ที่การอ่านให้เร็วที่สุด แต่อยู่ที่จังหวะที่เราได้ซึมซับเรื่องราวในแต่ละหน้า',
  'Family JS',
  'dongjs.dev@gmail.com'
)
on conflict (id) do nothing;

-- Enable RLS
alter table public.about_profile enable row level security;

-- Public can read
drop policy if exists about_profile_read on public.about_profile;
create policy about_profile_read on public.about_profile for select to anon, authenticated
using (true);

-- Admin and Editor can update
drop policy if exists about_profile_write on public.about_profile;
create policy about_profile_write on public.about_profile for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'editor')))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'editor')));

commit;
