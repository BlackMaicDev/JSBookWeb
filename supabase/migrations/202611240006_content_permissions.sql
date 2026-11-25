-- Apply after 202611230004_secure_covers.sql.
-- Keep unpublished books private and limit editors to their own content.

begin;

create index if not exists reviews_book_id_idx on public.reviews (book_id);

drop policy if exists books_read on public.books;
create policy books_read on public.books for select to anon, authenticated
using (
  exists (select 1 from public.reviews r where r.book_id = books.id and r.status = 'published')
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin'))
);

drop policy if exists books_edit on public.books;
drop policy if exists books_insert on public.books;
drop policy if exists books_update on public.books;
drop policy if exists books_delete_admin on public.books;
create policy books_insert on public.books for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('editor', 'admin')));
create policy books_update on public.books for update to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reviews r where r.book_id = books.id and r.author_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reviews r where r.book_id = books.id and r.author_id = (select auth.uid()))
);
create policy books_delete_admin on public.books for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists shelf_edit on public.genre_shelf_items;
drop policy if exists shelf_insert on public.genre_shelf_items;
drop policy if exists shelf_update on public.genre_shelf_items;
drop policy if exists shelf_delete_admin on public.genre_shelf_items;
create policy shelf_insert on public.genre_shelf_items for insert to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reviews r where r.id = review_id and r.author_id = (select auth.uid()))
);
create policy shelf_update on public.genre_shelf_items for update to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reviews r where r.id = review_id and r.author_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or exists (select 1 from public.reviews r where r.id = review_id and r.author_id = (select auth.uid()))
);
create policy shelf_delete_admin on public.genre_shelf_items for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

-- The object path does not encode an uploader, so deletion is reserved for admins.
drop policy if exists book_covers_editor_delete on storage.objects;
drop policy if exists book_covers_admin_delete on storage.objects;
create policy book_covers_admin_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'book-covers'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

commit;
