import { createClient } from "@supabase/supabase-js";
import type { BlogPost } from "@/lib/blog-data";
import { GENRE_THEMES, type GenreBook, type GenreId, type GenreThemeConfig } from "@/lib/genres-data";
import { sanitizeRichText } from "@/lib/content/rich-text";

export interface LibraryStats {
  totalBooks: number;
  byGenre: Record<string, number>;
  totalPosts: number;
}

export interface TopBookItem {
  rank: number;
  book_id: string;
  note: string;
  book?: {
    id: string;
    title: string;
    english_title?: string | null;
    author: string;
    cover_path?: string | null;
    cover_url?: string;
    synopsis?: string | null;
    page_count?: number | null;
    publisher?: string | null;
  } | null;
}

export interface AboutProfileData {
  name: string;
  tagline: string;
  avatar_path?: string | null;
  avatar_url?: string | null;
  headline: string;
  bio_intro: string;
  story: string;
  favorite_quote: string;
  quote_author: string;
  top_books: TopBookItem[];
  contact_email: string;
  social_links: {
    goodreads?: string;
    instagram?: string;
    facebook?: string;
    github?: string;
  };
}

/** The public pages consume this shape, regardless of where content is stored. */
export interface ContentRepository {
  getGenre(id: GenreId): Promise<GenreThemeConfig | null>;
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(slug: BlogPost["slug"]): Promise<BlogPost | undefined>;
  getLibraryStats(): Promise<LibraryStats>;
  getAboutProfile(): Promise<AboutProfileData>;
}

// Supabase client instance for public content queries with ISR cache
function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing public Supabase configuration");

  return createClient(url, key, {
    global: {
      fetch: (input, init) => {
        return fetch(input, {
          ...init,
          next: { revalidate: 60, tags: ["public-content", "about-profile"] },
        });
      },
    },
  });
}

function readingTime(excerpt: string, sections: BlogPost["sections"]): string {
  const content = [excerpt, ...sections.flatMap((section) => [section.heading, section.html, ...(section.paragraphs ?? [])])]
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s/g, "");
  return `อ่าน ${Math.max(1, Math.ceil(content.length / 500))} นาที`;
}

const supabaseContent: ContentRepository = {
  async getGenre(id: GenreId): Promise<GenreThemeConfig | null> {
    const supabase = getPublicSupabase();

      // Query published shelf items for this genre, joining reviews and books
      const { data: shelfItems, error } = await supabase
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
          review:reviews!inner (
            id,
            slug,
            title,
            summary,
            content,
            highlight_quote,
            tags,
            rating,
            status,
            book:books!inner (
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
        .eq("genre_slug", id)
        .order("sort_order", { ascending: true });

      if (error) throw new Error(`Failed to load ${id} books: ${error.message}`);
      if (!shelfItems?.length) return null;

      const baseTheme = GENRE_THEMES[id];

      // Transform Supabase rows into GenreBook items
      const mapItemToBook = (item: NonNullable<typeof shelfItems>[number]): GenreBook => {
        const review = Array.isArray(item.review) ? item.review[0] : item.review;
        const book = review?.book ? (Array.isArray(review.book) ? review.book[0] : review.book) : null;
        const metrics = item.metrics || { m1: 0, m2: 0, m3: 0, m4: 0 };

        return {
          id: review?.id || item.code,
          code: item.code || "",
          title: book?.title || review?.title || "",
          englishTitle: book?.english_title || "",
          author: book?.author || "",
          translator: book?.translator || undefined,
          publisher: book?.publisher || undefined,
          pages: book?.page_count ?? null,
          rating: review?.rating == null ? null : Number(review.rating),
          stamp: {
            text: item.stamp_text || "",
            variant: (["crimson", "amber", "cyan", "emerald", "purple"] as const).find((variant) => variant === item.stamp_variant) || "amber",
          },
          coverGradient: item.cover_style || "bg-gradient-to-br from-stone-700 to-stone-900",
          coverUrl: book?.cover_path
            ? supabase.storage.from("book-covers").getPublicUrl(book.cover_path).data.publicUrl
            : undefined,
          synopsis: book?.synopsis || review?.summary || "",
          detailHtml: sanitizeRichText(review?.content),
          highlightQuote: review?.highlight_quote || "",
          tags: review?.tags || [],
          metrics: {
            m1: Number(metrics.m1) || 0,
            m2: Number(metrics.m2) || 0,
            m3: Number(metrics.m3) || 0,
            m4: Number(metrics.m4) || 0,
          },
        };
      };

      const spotlightItem = shelfItems.find((item) => item.is_spotlight) ?? shelfItems[0];
      const spotlightBook = mapItemToBook(spotlightItem);
      const books = shelfItems.filter((item) => item !== spotlightItem).map(mapItemToBook);
      const tagCounts = new Map<string, number>();
      for (const book of [spotlightBook, ...books]) {
        for (const tag of book.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
      const subGenres = [...tagCounts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ name, english: `${count} เล่ม`, count }));

      return {
        ...baseTheme,
        subGenres,
        spotlightBook,
        books,
      };
  },

  async getBlogPosts(): Promise<BlogPost[]> {
    const supabase = getPublicSupabase();

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw new Error(`Failed to load blog posts: ${error.message}`);
      if (!data?.length) return [];

      return data.map((post) => ({
        slug: post.slug,
        category: post.category,
        title: post.title,
        excerpt: post.excerpt,
        readingTime: readingTime(post.excerpt, Array.isArray(post.sections) ? post.sections as BlogPost["sections"] : []),
        issue: "STORY",
        art: (["morning", "home", "notes", "weekend"] as const).find((art) => art === post.art_key) || "morning",
        coverUrl: typeof post.sections?.[0]?.cover_path === "string" && /^books\/[a-f0-9-]+\.(webp|jpe?g)$/i.test(post.sections[0].cover_path)
          ? supabase.storage.from("book-covers").getPublicUrl(post.sections[0].cover_path).data.publicUrl
          : undefined,
        quote: post.quote || "",
        sections: Array.isArray(post.sections) ? (post.sections as BlogPost["sections"]).map((section) => section.html ? { html: sanitizeRichText(section.html) } : section) : [],
      }));
  },

  async getBlogPost(slug: BlogPost["slug"]): Promise<BlogPost | undefined> {
    const posts = await this.getBlogPosts();
    return posts.find((p) => p.slug === slug);
  },

  async getLibraryStats(): Promise<LibraryStats> {
    const supabase = getPublicSupabase();
    try {
      const [{ count: totalBooks }, { data: shelfItems }, { count: totalPosts }] = await Promise.all([
        supabase.from("books").select("id", { count: "exact" }).limit(1),
        supabase.from("genre_shelf_items").select("genre_slug"),
        supabase.from("blog_posts").select("id", { count: "exact" }).eq("status", "published").limit(1),
      ]);

      const byGenre: Record<string, number> = {};
      (shelfItems || []).forEach((item) => {
        byGenre[item.genre_slug] = (byGenre[item.genre_slug] || 0) + 1;
      });

      return {
        totalBooks: totalBooks ?? (shelfItems?.length || 178),
        byGenre,
        totalPosts: totalPosts ?? 0,
      };
    } catch {
      return {
        totalBooks: 178,
        byGenre: { crime: 138, classics: 31, romance: 8, wuxia: 1 },
        totalPosts: 5,
      };
    }
  },

  async getAboutProfile(): Promise<AboutProfileData> {
    const supabase = getPublicSupabase();
    const defaultData: AboutProfileData = {
      name: "Dong JS",
      tagline: "Curator, Reader & Developer",
      avatar_path: null,
      avatar_url: null,
      headline: "ยินดีต้อนรับสู่บ้านหนังสือ Family JS",
      bio_intro: "พื้นที่เล็ก ๆ ของคนชอบอ่าน ที่เชื่อว่าหนังสือทุกเล่มมีเรื่องเล่า และทุกเรื่องเล่ามีเวลาที่เหมาะกับมัน ไม่จำเป็นต้องอ่านจบทุกเล่มในวันเดียว แค่วันนี้มีเวลาเปิดอ่านสักสองสามหน้า ก็เป็นวันที่ดีแล้ว",
      story: "Family JS เกิดขึ้นจากความตั้งใจง่าย ๆ คือ อยากมีชั้นหนังสือดิจิทัลส่วนตัว ที่ไม่ใช่แค่รายการชื่อหนังสือแห้ง ๆ แต่เป็นที่ที่เราสามารถบันทึกความรู้สึก โควทข้อความที่กระทบใจ และบรรยากาศในวันที่เราได้อ่านหนังสือเล่มนั้นจริง ๆ",
      favorite_quote: "หนังสือเปิดช้า ๆ ชีวิตก็เช่นกัน — บางครั้งความสุขไม่ได้อยู่ที่การอ่านให้เร็วที่สุด แต่อยู่ที่จังหวะที่เราได้ซึมซับเรื่องราวในแต่ละหน้า",
      quote_author: "Family JS",
      top_books: [],
      contact_email: "dongjs.dev@gmail.com",
      social_links: { goodreads: "", instagram: "", facebook: "", github: "" },
    };

    try {
      const { data, error } = await supabase
        .from("about_profile")
        .select("*")
        .eq("id", "main")
        .maybeSingle();

      if (error || !data) return defaultData;

      const topBooksRaw: { rank: number; book_id: string; note?: string }[] = Array.isArray(data.top_books)
        ? data.top_books
        : [];

      let top_books: TopBookItem[] = [];
      if (topBooksRaw.length > 0) {
        const bookIds = topBooksRaw.map((b) => b.book_id).filter(Boolean);
        if (bookIds.length > 0) {
          const { data: booksData } = await supabase
            .from("books")
            .select("id, title, english_title, author, cover_path, synopsis, page_count, publisher")
            .in("id", bookIds);

          const bookMap = new Map((booksData || []).map((b) => [b.id, b]));
          top_books = topBooksRaw
            .sort((a, b) => (a.rank || 0) - (b.rank || 0))
            .map((item) => {
              const b = bookMap.get(item.book_id);
              return {
                rank: item.rank,
                book_id: item.book_id,
                note: item.note || "",
                book: b
                  ? {
                      ...b,
                      cover_url: b.cover_path
                        ? supabase.storage.from("book-covers").getPublicUrl(b.cover_path).data.publicUrl
                        : undefined,
                    }
                  : null,
              };
            });
        }
      }

      const avatar_url = data.avatar_path
        ? data.avatar_path.startsWith("http")
          ? data.avatar_path
          : supabase.storage.from("book-covers").getPublicUrl(data.avatar_path).data.publicUrl
        : null;

      return {
        name: data.name || defaultData.name,
        tagline: data.tagline || defaultData.tagline,
        avatar_path: data.avatar_path,
        avatar_url,
        headline: data.headline || defaultData.headline,
        bio_intro: data.bio_intro || defaultData.bio_intro,
        story: data.story || defaultData.story,
        favorite_quote: data.favorite_quote || defaultData.favorite_quote,
        quote_author: data.quote_author || defaultData.quote_author,
        top_books,
        contact_email: data.contact_email || defaultData.contact_email,
        social_links: typeof data.social_links === "object" && data.social_links !== null ? data.social_links : defaultData.social_links,
      };
    } catch {
      return defaultData;
    }
  },
};

export const contentRepository: ContentRepository = supabaseContent;
