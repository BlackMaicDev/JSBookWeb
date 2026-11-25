import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireEditor } from "@/lib/supabase/admin";

export async function POST() {
  const access = await requireEditor();
  if (access instanceof NextResponse) return access;
  const { supabase, role } = access;

  if (role !== "admin") {
    return NextResponse.json(
      {
        success: false,
        error:
          "เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถสั่งเผยแพร่ทั้งหมดได้",
      },
      { status: 403 },
    );
  }

  try {
    // 1. Publish all draft reviews (preserving null ratings for unread books)
    const { error: publishErr } = await supabase
      .from("reviews")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("status", "draft");
    if (publishErr) throw publishErr;

    // 3. Update shelf stamp from DRAFT to RECOMMENDED
    const { error: shelfErr } = await supabase
      .from("genre_shelf_items")
      .update({
        stamp_text: "RECOMMENDED",
        stamp_variant: "amber",
      })
      .eq("stamp_text", "DRAFT");
    if (shelfErr) console.warn("Shelf stamp update warning:", shelfErr.message);

    // 3. Ensure at least one spotlight book exists per genre
    const { data: shelfItems } = await supabase
      .from("genre_shelf_items")
      .select("review_id, genre_slug, is_spotlight, sort_order")
      .order("sort_order", { ascending: true });

    if (shelfItems && shelfItems.length > 0) {
      const genres = Array.from(new Set(shelfItems.map((s) => s.genre_slug)));
      for (const genre of genres) {
        const itemsInGenre = shelfItems.filter((s) => s.genre_slug === genre);
        const hasSpotlight = itemsInGenre.some((s) => s.is_spotlight);
        if (!hasSpotlight && itemsInGenre[0]) {
          await supabase
            .from("genre_shelf_items")
            .update({ is_spotlight: true })
            .eq("review_id", itemsInGenre[0].review_id);
        }
      }
    }

    // 5. Invalidate Next.js cache for public routes
    try {
      revalidatePath("/");
      revalidatePath("/genre/crime");
      revalidatePath("/genre/classics");
      revalidatePath("/genre/romance");
      revalidatePath("/genre/wuxia");
      revalidatePath("/genre/manga");
    } catch (e) {
      console.warn("revalidatePath warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: "เผยแพร่หนังสือทั้งหมดสู่หน้าเว็บเรียบร้อยแล้ว",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
