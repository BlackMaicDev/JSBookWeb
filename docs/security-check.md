# Security check for Family JS

For a new project, apply the files in `supabase/migrations` in order: `001`, `004`, `006`, `007`. The old demo scripts are preserved under `supabase/legacy` and must not be applied: `002` opens content writes to anonymous users, and `003` grants admin to all users and confirms their emails. For a project that already ran them, apply `004` and then `006` if not yet applied, followed by `007`. Migration `004` stops new promotions but cannot determine which existing accounts are legitimate admins. Migration `007` fixes the book read policy so visitors can see books linked to published reviews.

The former `supabase/seed.sql` is now `supabase/legacy/seed_demo.sql`. It creates a fixed demo admin account and deletes existing content. Never run it on a real project. If it was run previously, check for `editor@familyjs.local` in the query below; remove that account in Supabase Auth if it is not a legitimate account.

Run this read-only query in the SQL Editor and review every privileged account:

```sql
select u.email, p.role, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where p.role in ('admin', 'editor')
order by p.role, u.email;
```

Only trusted accounts should retain `admin` or `editor`. Correct a wrongly promoted account by its exact email after reviewing the result:

```sql
update public.profiles p
set role = 'reader'
from auth.users u
where p.id = u.id and lower(u.email) = lower('account-to-demote@example.com');
```

Verify the old broad policies are gone:

```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and policyname in ('allow_all_books', 'allow_all_reviews', 'allow_all_shelf', 'allow_all_blog', 'books_edit', 'shelf_edit');
```

The last query should return no rows after both migrations. Also check Supabase Auth settings: hiding signup in the login UI does not disable server-side signup. If registration should be closed, disable signup in the Supabase project settings.

Check whether the demo account exists, regardless of its current role:

```sql
select u.id, u.email, p.role
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = 'editor@familyjs.local';
```
