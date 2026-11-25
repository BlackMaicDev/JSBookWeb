import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireEditor } from "@/lib/supabase/admin";

// GET: Fetch about profile and list of all books for dropdown selection
export async function GET() {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase } = access;

  try {
    const [
      { data: profile, error: profErr },
      { data: allBooks, error: booksErr },
      { data: shelves, error: shelvesErr },
    ] = await Promise.all([
      supabase.from("about_profile").select("*").eq("id", "main").maybeSingle(),
      supabase
        .from("books")
        .select("id, title, author, english_title, cover_path")
        .order("title", { ascending: true }),
      supabase
        .from("genre_shelf_items")
        .select("genre_slug, review:reviews(book_id)"),
    ]);

    if (profErr) {
      console.warn("about_profile fetch warning:", profErr.message);
    }
    if (booksErr) {
      console.error("books fetch error:", booksErr.message);
    }

    const bookGenreMap: Record<string, string> = {};
    (shelves || []).forEach((s: any) => {
      const rev = Array.isArray(s.review) ? s.review[0] : s.review;
      if (rev?.book_id) {
        bookGenreMap[rev.book_id] = s.genre_slug;
      }
    });

    const booksWithCovers = (allBooks || []).map((b) => ({
      ...b,
      genre_slug: bookGenreMap[b.id] || "crime",
      cover_url: b.cover_path
        ? supabase.storage.from("book-covers").getPublicUrl(b.cover_path).data.publicUrl
        : null,
    }));

    return NextResponse.json({
      success: true,
      profile: profile || null,
      books: booksWithCovers,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// PUT: Update about profile and top 10 books
export async function PUT(request: Request) {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase } = access;

  try {
    const body = await request.json();
    const {
      name,
      tagline,
      avatar_path,
      headline,
      bio_intro,
      story,
      favorite_quote,
      quote_author,
      top_books,
      contact_email,
      social_links,
    } = body;

    const payload = {
      id: "main",
      name: name?.trim() || "Dong JS",
      tagline: tagline?.trim() || "Curator, Reader & Developer",
      avatar_path: avatar_path || null,
      headline: headline?.trim() || "ยินดีต้อนรับสู่บ้านหนังสือ Family JS",
      bio_intro: bio_intro?.trim() || "",
      story: story?.trim() || "",
      favorite_quote: favorite_quote?.trim() || "",
      quote_author: quote_author?.trim() || "Family JS",
      top_books: Array.isArray(top_books) ? top_books : [],
      contact_email: contact_email?.trim() || "dongjs.dev@gmail.com",
      social_links: typeof social_links === "object" && social_links !== null ? social_links : {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("about_profile")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;

    // Revalidate the about page cache immediately
    try {
      revalidatePath("/about", "page");
      revalidatePath("/", "page");
    } catch (e) {
      console.warn("revalidate error:", e);
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลหน้า About Me เรียบร้อยแล้ว",
      profile: data,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
