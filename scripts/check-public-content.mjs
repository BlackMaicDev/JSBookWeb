/** Read-only check of what anonymous visitors can see through Supabase RLS. */
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Missing public Supabase environment variables");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const summarize = ({ count, data, error }) => ({
  count: count ?? data?.length ?? null,
  error: error ? { code: error.code, message: error.message } : null,
});

const [reviews, shelf, books, joined, posts] = await Promise.all([
  supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "published"),
  supabase.from("genre_shelf_items").select("review_id", { count: "exact", head: true }).eq("genre_slug", "crime"),
  supabase.from("books").select("id", { count: "exact", head: true }),
  supabase.from("genre_shelf_items")
    .select("review:reviews!inner(id,status,book:books!inner(id))")
    .eq("genre_slug", "crime")
    .limit(1),
  supabase.from("blog_posts").select("slug", { count: "exact", head: true }).eq("status", "published"),
]);

console.log(JSON.stringify({
  publishedReviews: summarize(reviews),
  visibleCrimeShelfItems: summarize(shelf),
  visibleBooks: summarize(books),
  nestedGenreQuery: summarize(joined),
  publishedBlogPosts: summarize(posts),
}, null, 2));
