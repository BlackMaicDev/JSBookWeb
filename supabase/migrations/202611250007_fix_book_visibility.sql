-- In policy 006, bare `id` inside the reviews subquery resolved to reviews.id.
-- Compare against the outer books row so published books are visible to readers.

begin;

drop policy if exists books_read on public.books;
create policy books_read on public.books for select to anon, authenticated
using (
  exists (select 1 from public.reviews r where r.book_id = books.id and r.status = 'published')
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin'))
);

drop policy if exists books_update on public.books;
create policy books_update on public.books for update to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reviews r where r.book_id = books.id and r.author_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reviews r where r.book_id = books.id and r.author_id = (select auth.uid()))
);

commit;
