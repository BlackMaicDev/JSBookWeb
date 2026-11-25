import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/supabase/admin";
import { sanitizeRichText } from "@/lib/content/rich-text";

function parseRating(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 && rating * 2 === Math.trunc(rating * 2)
    ? rating
    : null;
}

// GET: Fetch all reviews with books and shelf item details
export async function GET() {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase } = access;

  try {
    const { data: shelfItems, error: shelfErr } = await supabase
      .from("genre_shelf_items")
      .select(`
        genre_slug,
        sort_order,
        is_spotlight,
        code,
        stamp_text,
        stamp_variant,
        cover_style,
        metrics,
        review:reviews (
          id,
          book_id,
          author_id,
          slug,
          title,
          summary,
          content,
          highlight_quote,
          tags,
          rating,
          status,
          published_at,
          book:books (
            id,
            title,
            english_title,
            author,
            translator,
            publisher,
            page_count,
            cover_path,
            synopsis
          )
        )
      `)
      .order("genre_slug", { ascending: true })
      .order("sort_order", { ascending: true });

    if (shelfErr) throw shelfErr;

    // Flatten into clean structure for admin table
    const items = (shelfItems || []).map((item) => {
      const review = Array.isArray(item.review) ? item.review[0] : item.review;
      const book = review?.book ? (Array.isArray(review.book) ? review.book[0] : review.book) : null;

      return {
        genre_slug: item.genre_slug,
        sort_order: item.sort_order,
        is_spotlight: item.is_spotlight,
        code: item.code,
        stamp_text: item.stamp_text,
        stamp_variant: item.stamp_variant,
        cover_style: item.cover_style,
        metrics: item.metrics,
        review_id: review?.id,
        review_title: review?.title || "",
        review_slug: review?.slug || "",
        summary: review?.summary || "",
        content: review?.content || "",
        highlight_quote: review?.highlight_quote || "",
        tags: review?.tags || [],
        rating: review?.rating == null ? null : Number(review.rating),
        status: review?.status || "draft",
        published_at: review?.published_at,
        book_id: book?.id,
        book_title: book?.title || "",
        english_title: book?.english_title || "",
        author: book?.author || "",
        translator: book?.translator || "",
        publisher: book?.publisher || "",
        page_count: book?.page_count || 0,
        cover_path: book?.cover_path || null,
        synopsis: book?.synopsis || "",
      };
    });

    return NextResponse.json({ success: true, data: items });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// POST: Create a new book, review, and shelf item
export async function POST(request: Request) {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase, userId } = access;

  try {
    const body = await request.json();
    const {
      title,
      english_title,
      author,
      translator,
      publisher,
      page_count,
      synopsis,
      cover_path,
      review_title,
      slug,
      summary,
      content,
      highlight_quote,
      tags,
      rating,
      status,
      genre_slug,
      code,
      stamp_text,
      stamp_variant,
      is_spotlight,
    } = body;

    if (!title || !author || (status === "published" && !summary?.trim())) {
      return NextResponse.json({ error: "กรุณากรอกชื่อหนังสือ ผู้แต่ง และคำโปรยก่อนเผยแพร่" }, { status: 400 });
    }

    const safeRating = parseRating(rating);
    if (status === "published" && safeRating === null) {
      return NextResponse.json({ error: "กรุณาให้คะแนนก่อนเผยแพร่รีวิว" }, { status: 400 });
    }

    // 1. Create Book
    const { data: newBook, error: bookErr } = await supabase
      .from("books")
      .insert({
        title: title.trim(),
        english_title: english_title?.trim() || null,
        author: author.trim(),
        translator: translator?.trim() || null,
        publisher: publisher?.trim() || null,
        page_count: Number(page_count) || null,
        synopsis: synopsis?.trim() || summary?.trim() || "",
        cover_path: typeof cover_path === "string" && /^books\/[a-f0-9-]+\.(webp|png|jpe?g)$/i.test(cover_path) ? cover_path : null,
      })
      .select()
      .single();

    if (bookErr) throw bookErr;

    // 2. Generate unique slug if not provided
    const reviewSlug = (slug?.trim() || `review-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9\u0E00-\u0E7F-_]+/g, "-");

    const formattedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    // 3. Create Review
    const { data: newReview, error: reviewErr } = await supabase
      .from("reviews")
      .insert({
        book_id: newBook.id,
        author_id: userId,
        slug: reviewSlug,
        title: review_title?.trim() || `รีวิว ${title.trim()}`,
        summary: summary?.trim() || "",
        content: sanitizeRichText(content),
        highlight_quote: highlight_quote?.trim() || null,
        tags: formattedTags,
        rating: safeRating,
        status: status === "published" ? "published" : "draft",
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (reviewErr) throw reviewErr;

    // 4. Determine sort_order for shelf item
    const targetGenre = genre_slug || "crime";
    const { data: existingShelf } = await supabase
      .from("genre_shelf_items")
      .select("sort_order")
      .eq("genre_slug", targetGenre)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = existingShelf && existingShelf.length > 0 ? existingShelf[0].sort_order + 1 : 0;

    // Default cover gradient per genre
    const gradients: Record<string, string> = {
      crime: "bg-gradient-to-br from-red-950 via-zinc-900 to-black",
      classics: "bg-gradient-to-br from-amber-950 via-stone-900 to-black",
      wuxia: "bg-gradient-to-br from-emerald-950 via-zinc-950 to-black",
      romance: "bg-gradient-to-br from-rose-950 via-purple-950 to-black",
      manga: "bg-gradient-to-br from-cyan-950 via-zinc-900 to-black",
    };

    // If spotlight requested, remove spotlight from existing spotlight item in that genre
    if (is_spotlight) {
      await supabase
        .from("genre_shelf_items")
        .update({ is_spotlight: false })
        .eq("genre_slug", targetGenre);
    }

    const { error: shelfErr } = await supabase
      .from("genre_shelf_items")
      .insert({
        genre_slug: targetGenre,
        review_id: newReview.id,
        sort_order: nextOrder,
        is_spotlight: Boolean(is_spotlight),
        code: code?.trim() || `CASE #${String(100 + nextOrder).padStart(3, "0")}`,
        stamp_text: stamp_text?.trim() || "RECOMMENDED",
        stamp_variant: stamp_variant || "amber",
        cover_style: gradients[targetGenre] || gradients.crime,
        metrics: { m1: 5, m2: 4, m3: 4, m4: 5 },
      });

    if (shelfErr) throw shelfErr;

    return NextResponse.json({ success: true, data: { book: newBook, review: newReview } });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// PUT: Update an existing review, book, and shelf placement
export async function PUT(request: Request) {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase, userId, role } = access;

  try {
    const body = await request.json();
    const {
      book_id,
      review_id,
      title,
      english_title,
      author,
      translator,
      publisher,
      page_count,
      synopsis,
      cover_path,
      review_title,
      slug,
      summary,
      content,
      highlight_quote,
      tags,
      rating,
      status,
      genre_slug,
      code,
      stamp_text,
      stamp_variant,
      is_spotlight,
    } = body;

    if (!book_id || !review_id) {
      return NextResponse.json({ error: "Missing book_id or review_id" }, { status: 400 });
    }
    if (status === "published" && !summary?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกคำโปรยก่อนเผยแพร่" }, { status: 400 });
    }

    const { data: existingReview, error: lookupErr } = await supabase
      .from("reviews")
      .select("book_id, author_id")
      .eq("id", review_id)
      .single();
    if (lookupErr || !existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (existingReview.book_id !== book_id) {
      return NextResponse.json({ error: "Book does not belong to this review" }, { status: 400 });
    }
    if (role !== "admin" && existingReview.author_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const safeRating = parseRating(rating);
    if (status === "published" && safeRating === null) {
      return NextResponse.json({ error: "กรุณาให้คะแนนก่อนเผยแพร่รีวิว" }, { status: 400 });
    }

    // 1. Update Book
    const { data: updatedBook, error: bookErr } = await supabase
      .from("books")
      .update({
        title: title?.trim(),
        english_title: english_title?.trim() || null,
        author: author?.trim(),
        translator: translator?.trim() || null,
        publisher: publisher?.trim() || null,
        page_count: Number(page_count) || null,
        synopsis: synopsis?.trim() || summary?.trim(),
        ...(cover_path !== undefined ? { cover_path: typeof cover_path === "string" && /^books\/[a-f0-9-]+\.(webp|png|jpe?g)$/i.test(cover_path) ? cover_path : null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", book_id)
      .select("id")
      .maybeSingle();

    if (bookErr) throw bookErr;
    if (!updatedBook) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const formattedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    // 3. Update Review
    const { data: updatedReview, error: reviewErr } = await supabase
      .from("reviews")
      .update({
        title: review_title?.trim() || `รีวิว ${title?.trim()}`,
        slug: slug?.trim(),
        summary: summary?.trim(),
        content: sanitizeRichText(content),
        highlight_quote: highlight_quote?.trim() || null,
        tags: formattedTags,
        rating: safeRating,
        status: status === "published" ? "published" : "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", review_id)
      .select("id")
      .maybeSingle();

    if (reviewErr) throw reviewErr;
    if (!updatedReview) return NextResponse.json({ error: "Review could not be updated" }, { status: 403 });

    // 4. Update shelf placement, including a changed genre.
    if (genre_slug) {
      const { data: currentShelf, error: shelfLookupErr } = await supabase
        .from("genre_shelf_items")
        .select("genre_slug")
        .eq("review_id", review_id)
        .maybeSingle();
      if (shelfLookupErr) throw shelfLookupErr;
      if (!currentShelf) return NextResponse.json({ error: "Shelf placement not found" }, { status: 404 });

      let nextOrder: number | undefined;
      if (currentShelf.genre_slug !== genre_slug) {
        const { data: lastShelf, error: orderErr } = await supabase
          .from("genre_shelf_items")
          .select("sort_order")
          .eq("genre_slug", genre_slug)
          .order("sort_order", { ascending: false })
          .limit(1);
        if (orderErr) throw orderErr;
        nextOrder = (lastShelf?.[0]?.sort_order ?? -1) + 1;
      }

      if (is_spotlight) {
        const { error: spotlightErr } = await supabase
          .from("genre_shelf_items")
          .update({ is_spotlight: false })
          .eq("genre_slug", genre_slug);
        if (spotlightErr) throw spotlightErr;
      }

      const { data: updatedShelf, error: shelfErr } = await supabase
        .from("genre_shelf_items")
        .update({
          genre_slug,
          ...(nextOrder !== undefined ? { sort_order: nextOrder } : {}),
          code: code?.trim(),
          stamp_text: stamp_text?.trim(),
          stamp_variant: stamp_variant || "amber",
          is_spotlight: Boolean(is_spotlight),
        })
        .eq("review_id", review_id)
        .select("review_id")
        .maybeSingle();
      if (shelfErr) throw shelfErr;
      if (!updatedShelf) return NextResponse.json({ error: "Shelf placement could not be updated" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// DELETE: Delete review, shelf placement, and book
export async function DELETE(request: Request) {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase, role } = access;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("review_id");

    if (!reviewId) {
      return NextResponse.json({ error: "Missing review_id parameter" }, { status: 400 });
    }

    const { data: review, error: lookupErr } = await supabase
      .from("reviews")
      .select("book_id")
      .eq("id", reviewId)
      .single();
    if (lookupErr || !review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    // 1. Delete shelf item
    const { error: shelfErr } = await supabase.from("genre_shelf_items").delete().eq("review_id", reviewId);
    if (shelfErr) throw shelfErr;

    // 2. Delete review
    const { data: deletedReview, error: revErr } = await supabase.from("reviews").delete().eq("id", reviewId).select("id").maybeSingle();
    if (revErr) throw revErr;
    if (!deletedReview) return NextResponse.json({ error: "Review could not be deleted" }, { status: 403 });

    // 3. Delete only the book linked to the review
    const { error: bookErr } = await supabase.from("books").delete().eq("id", review.book_id);
    if (bookErr) throw bookErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
