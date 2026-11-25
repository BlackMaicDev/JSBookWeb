import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/supabase/admin";
import { sanitizeRichText } from "@/lib/content/rich-text";

function validBlogCoverPath(value: unknown): value is string {
  return typeof value === "string" && /^books\/[a-f0-9-]+\.(webp|jpe?g)$/i.test(value);
}

function cleanSections(sections: unknown, coverPath: string | null) {
  if (!Array.isArray(sections)) return [];
  const cleaned = sections.map((section) => {
    if (section && typeof section === "object" && "html" in section) {
      return { html: sanitizeRichText(section.html) };
    }
    return section;
  });
  if (cleaned.length > 0 && cleaned[0] && typeof cleaned[0] === "object") {
    cleaned[0] = { ...cleaned[0], cover_path: coverPath };
  }
  return cleaned;
}

// GET: Fetch all blog posts
export async function GET() {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase } = access;

  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const posts = (data || []).map((post) => ({
      ...post,
      cover_path: post.cover_path || (Array.isArray(post.sections) ? post.sections[0]?.cover_path : null) || null,
    }));
    return NextResponse.json({ success: true, data: posts });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// POST: Create a new blog post
export async function POST(request: Request) {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase, userId } = access;

  try {
    const body = await request.json();
    const { title, slug, category, excerpt, quote, art_key, cover_path, sections, status } = body;

    if (!title || !category || !excerpt) {
      return NextResponse.json({ error: "กรุณากรอกหัวข้อ หมวดหมู่ และคำนำให้ครบถ้วน" }, { status: 400 });
    }
    if (cover_path && !validBlogCoverPath(cover_path)) {
      return NextResponse.json({ error: "รูปปกบทความไม่ถูกต้อง" }, { status: 400 });
    }

    const postSlug = (slug?.trim() || `post-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9\u0E00-\u0E7F-_]+/g, "-");

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        author_id: userId,
        slug: postSlug,
        category: category.trim(),
        title: title.trim(),
        excerpt: excerpt.trim(),
        quote: quote?.trim() || null,
        art_key: art_key || "morning",
        sections: cleanSections(sections, cover_path || null),
        status: status === "published" ? "published" : "draft",
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// PUT: Update an existing blog post
export async function PUT(request: Request) {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase } = access;

  try {
    const body = await request.json();
    const { id, title, slug, category, excerpt, quote, art_key, cover_path, sections, status } = body;

    if (!id) return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    if (cover_path && !validBlogCoverPath(cover_path)) {
      return NextResponse.json({ error: "รูปปกบทความไม่ถูกต้อง" }, { status: 400 });
    }

    const { data: updatedPost, error } = await supabase
      .from("blog_posts")
      .update({
        title: title?.trim(),
        slug: slug?.trim(),
        category: category?.trim(),
        excerpt: excerpt?.trim(),
        quote: quote?.trim() || null,
        art_key: art_key || "morning",
        sections: cleanSections(sections, cover_path || null),
        status: status === "published" ? "published" : "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!updatedPost) return NextResponse.json({ error: "Post not found or forbidden" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// DELETE: Delete a blog post
export async function DELETE(request: Request) {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase, role } = access;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });

    const { data: deletedPost, error } = await supabase.from("blog_posts").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!deletedPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
