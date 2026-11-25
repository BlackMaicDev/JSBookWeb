# Deploy Family JS to Vercel

The app uses Next.js Route Handlers, Supabase Auth, and server rendering. Import the Git repository into Vercel as a **Next.js** project. Keep the repository root as the Root Directory and the default `npm run build` command. Do not select a static export. No `vercel.json` is needed.

## Before deploying

1. Commit and push the website files. Vercel's Git deployment cannot see local uncommitted files. Keep `.env.local` out of Git.
2. In the production Supabase project, apply migrations from `supabase/migrations` in order (`001`, `004`, `006`, `007`) if it is new. For an existing project, check which migrations have already run and follow [security-check.md](security-check.md). Confirm that Storage bucket `book-covers` exists and the intended account has `profiles.role = 'admin'`.
3. In **Vercel → Project → Settings → Environment Variables**, add:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, such as `https://project-ref.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) |

   The app also accepts the older `NEXT_PUBLIC_SUPABASE_ANON_KEY` in place of the publishable key. Add variables to **Production** and also **Preview** if previews should use Supabase. Never put a Supabase secret/service role key in a `NEXT_PUBLIC_` variable. Redeploy after adding or changing these variables.

## Auth URLs

In **Supabase → Authentication → URL Configuration**, set **Site URL** to the final production URL, for example `https://family-js.vercel.app`. Add `https://family-js.vercel.app/auth/callback` to **Redirect URLs** if OAuth or email links are enabled. The current email/password sign-in does not use that callback. Add a preview URL pattern only if authentication should work on Vercel previews; use a pattern scoped to your Vercel team as described in the Supabase redirect URL documentation. Once a custom domain becomes primary, update the Site URL and allowlist with that domain.

## After deploying

Open `/`, `/genre/crime`, `/blog`, `/login`, and `/admin`. Sign in with the approved admin account, upload one image to `book-covers`, and publish a test item. Public content is cached for up to 60 seconds, so allow a minute for a newly published item to appear. If login works locally but fails on Vercel, first check that the production deployment has the two environment variables and that the Supabase project/role matches the account you used.
