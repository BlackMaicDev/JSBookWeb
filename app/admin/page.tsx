"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpenText,
  Copy,
  Check,
  FilePenLine,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Newspaper,
  Plus,
  Search,
  Trash2,
  X,
  ExternalLink,
  Edit,
  Sparkles,
  Loader2,
  UserCheck,
  Award,
  Upload,
} from "lucide-react";
import { GENRE_THEMES, type GenreId } from "@/lib/genres-data";
import FamilyLogo from "@/components/FamilyLogo";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_COVER_SOURCE_BYTES,
  prepareCoverImage,
} from "@/lib/images/prepare-cover";
import RichTextEditor from "@/components/RichTextEditor";
import { uploadSiteImage } from "@/lib/images/upload-site-image";

type AdminSection =
  | "overview"
  | "reviews"
  | "blogs"
  | "review_editor"
  | "blog_editor"
  | "about";

interface AboutBookOption {
  id: string;
  title: string;
  author: string;
  english_title?: string;
  cover_path?: string | null;
  cover_url?: string | null;
  genre_slug?: GenreId | string;
}

interface TopBookSlot {
  rank: number;
  book_id: string;
  note: string;
}

const EMPTY_ABOUT_FORM = {
  name: "Dong JS",
  tagline: "Curator, Reader & Developer",
  avatar_path: "",
  headline: "ยินดีต้อนรับสู่บ้านหนังสือ Family JS",
  bio_intro:
    "พื้นที่เล็ก ๆ ของคนชอบอ่าน ที่เชื่อว่าหนังสือทุกเล่มมีเรื่องเล่า และทุกเรื่องเล่ามีเวลาที่เหมาะกับมัน ไม่จำเป็นต้องอ่านจบทุกเล่มในวันเดียว แค่วันนี้มีเวลาเปิดอ่านสักสองสามหน้า ก็เป็นวันที่ดีแล้ว",
  story:
    "Family JS เกิดขึ้นจากความตั้งใจง่าย ๆ คือ อยากมีชั้นหนังสือดิจิทัลส่วนตัว ที่ไม่ใช่แค่รายการชื่อหนังสือแห้ง ๆ แต่เป็นที่ที่เราสามารถบันทึกความรู้สึก โควทข้อความที่กระทบใจ และบรรยากาศในวันที่เราได้อ่านหนังสือเล่มนั้นจริง ๆ\n\nผมเชื่อว่าหนังสือแต่ละเล่มทำงานกับเราในวันที่ต่างกัน บางวันที่เหนื่อยล้า เราอาจแค่อยากเปิดนิยายรักอุ่น ๆ ที่อ่านแล้วยิ้มได้ บางวันที่อยากลับสมอง เราอาจเปิดแฟ้มคดีสืบสวนที่หักมุมจนลืมเวลา หรือบางคืนที่อยากอยู่เงียบ ๆ กับตัวเอง วรรณกรรมคลาสสิกข้ามศตวรรษก็เป็นเพื่อนคุยทางความคิดที่ดีที่สุด",
  favorite_quote:
    "หนังสือเปิดช้า ๆ ชีวิตก็เช่นกัน — บางครั้งความสุขไม่ได้อยู่ที่การอ่านให้เร็วที่สุด แต่อยู่ที่จังหวะที่เราได้ซึมซับเรื่องราวในแต่ละหน้า",
  quote_author: "Family JS",
  contact_email: "dongjs.dev@gmail.com",
  social_goodreads: "",
  social_instagram: "",
  social_facebook: "",
  social_github: "",
};

type DeleteTarget =
  | {
      type: "review";
      id: string;
      bookId: string;
      title: string;
      author: string;
      genre_slug: GenreId;
      code: string;
    }
  | {
      type: "blog";
      id: string;
      title: string;
      category: string;
    };

interface AdminReviewItem {
  genre_slug: GenreId;
  sort_order: number;
  is_spotlight: boolean;
  code: string;
  stamp_text: string;
  stamp_variant: string;
  cover_style: string;
  cover_path?: string | null;
  metrics: Record<string, number>;
  review_id: string;
  review_title: string;
  review_slug: string;
  summary: string;
  content?: string;
  highlight_quote?: string;
  tags: string[];
  rating: number | null;
  status: "published" | "draft";
  published_at?: string;
  book_id: string;
  book_title: string;
  english_title?: string;
  author: string;
  translator?: string;
  publisher?: string;
  page_count?: number;
  synopsis?: string;
}

interface AdminBlogPost {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  quote?: string;
  art_key?: string;
  cover_path?: string | null;
  status: "published" | "draft";
  published_at?: string;
  created_at: string;
  sections?: { heading?: string; paragraphs?: string[]; html?: string }[];
}

const GENRE_IDS: GenreId[] = ["crime", "classics", "wuxia", "romance", "manga"];

function escapeRichText(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] || character,
  );
}

const EMPTY_REVIEW_FORM = {
  book_title: "",
  english_title: "",
  author: "",
  translator: "",
  publisher: "",
  page_count: "" as number | "",
  synopsis: "",
  cover_path: "",
  review_title: "",
  slug: "",
  summary: "",
  content: "",
  highlight_quote: "",
  tags: "",
  rating: null as number | null,
  status: "draft" as "published" | "draft",
  genre_slug: "crime" as GenreId,
  code: "",
  stamp_text: "",
  stamp_variant: "amber",
  is_spotlight: false,
};

const EMPTY_BLOG_FORM = {
  title: "",
  slug: "",
  category: "",
  excerpt: "",
  quote: "",
  art_key: "morning",
  cover_path: "",
  status: "draft" as "published" | "draft",
  content: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [accessIssue, setAccessIssue] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

  // Auth state
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "editor" | null>(null);

  // Data state
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [richImageUploading, setRichImageUploading] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<GenreId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");

  // Review Form state
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Blog Form state
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogCoverFile, setBlogCoverFile] = useState<File | null>(null);
  const [blogCoverPreview, setBlogCoverPreview] = useState<string | null>(null);
  const blogCoverInput = useRef<HTMLInputElement>(null);

  // About Form state
  const [aboutForm, setAboutForm] = useState(EMPTY_ABOUT_FORM);
  const [topBooks, setTopBooks] = useState<TopBookSlot[]>(
    Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      book_id: "",
      note: "",
    })),
  );
  const [aboutBooksList, setAboutBooksList] = useState<AboutBookOption[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Top 10 Modal Book Picker state
  const [selectingRankSlot, setSelectingRankSlot] = useState<number | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalGenreFilter, setModalGenreFilter] = useState<GenreId | "all">("all");

  const filteredModalBooks = useMemo(() => {
    return aboutBooksList.filter((book) => {
      const matchesGenre =
        modalGenreFilter === "all" || book.genre_slug === modalGenreFilter;
      const q = modalSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${book.title} ${book.english_title || ""} ${book.author}`
          .toLowerCase()
          .includes(q);
      return matchesGenre && matchesSearch;
    });
  }, [aboutBooksList, modalGenreFilter, modalSearch]);

  // Feedback notifications
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);

  useEffect(
    () => () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );

  useEffect(
    () => () => {
      if (blogCoverPreview) URL.revokeObjectURL(blogCoverPreview);
    },
    [blogCoverPreview],
  );

  const storedCoverUrl = useMemo(
    () =>
      reviewForm.cover_path
        ? createClient()
            .storage.from("book-covers")
            .getPublicUrl(reviewForm.cover_path).data.publicUrl
        : null,
    [reviewForm.cover_path],
  );
  const storedBlogCoverUrl = useMemo(
    () =>
      blogForm.cover_path
        ? createClient()
            .storage.from("book-covers")
            .getPublicUrl(blogForm.cover_path).data.publicUrl
        : null,
    [blogForm.cover_path],
  );

  // Check auth and initial load
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    // Check the signed-in user's role before opening the editor.
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!mounted) return;
        if (!user) {
          router.replace("/login");
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (!mounted) return;
        setUserEmail(user.email || "");
        if (profileError) {
          setAccessIssue(
            "ตรวจสิทธิ์บัญชีไม่สำเร็จ กรุณาลองใหม่หรือตรวจการตั้งค่า Supabase",
          );
          return;
        }
        if (!profile) {
          setAccessIssue(
            "ไม่พบโปรไฟล์ของบัญชีนี้ใน Supabase กรุณาให้ผู้ดูแลสร้างโปรไฟล์และกำหนดสิทธิ์",
          );
          return;
        }
        if (profile?.role !== "admin" && profile?.role !== "editor") {
          setAccessIssue(
            `บัญชีนี้มี role เป็น ${profile.role} ต้องกำหนดเป็น editor หรือ admin ใน Supabase ก่อน`,
          );
          return;
        }
        setUserRole(profile.role);
        setReady(true);
        loadAllData();
      })
      .catch(() => {
        if (mounted)
          setAccessIssue("ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
      });

    // 2. Listen to auth state changes to keep session alive
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function loadAboutData() {
    try {
      const res = await fetch("/api/admin/about");
      const aboutJson = await res.json();
      if (aboutJson.success) {
        if (Array.isArray(aboutJson.books))
          setAboutBooksList(aboutJson.books);
        if (aboutJson.profile) {
          const p = aboutJson.profile;
          setAboutForm({
            name: p.name || EMPTY_ABOUT_FORM.name,
            tagline: p.tagline || EMPTY_ABOUT_FORM.tagline,
            avatar_path: p.avatar_path || "",
            headline: p.headline || EMPTY_ABOUT_FORM.headline,
            bio_intro: p.bio_intro || EMPTY_ABOUT_FORM.bio_intro,
            story: p.story || EMPTY_ABOUT_FORM.story,
            favorite_quote:
              p.favorite_quote || EMPTY_ABOUT_FORM.favorite_quote,
            quote_author: p.quote_author || EMPTY_ABOUT_FORM.quote_author,
            contact_email:
              p.contact_email || EMPTY_ABOUT_FORM.contact_email,
            social_goodreads: p.social_links?.goodreads || "",
            social_instagram: p.social_links?.instagram || "",
            social_facebook: p.social_links?.facebook || "",
            social_github: p.social_links?.github || "",
          });

          if (p.avatar_path) {
            const sUrl = p.avatar_path.startsWith("http")
              ? p.avatar_path
              : createClient()
                  .storage.from("book-covers")
                  .getPublicUrl(p.avatar_path).data.publicUrl;
            setAvatarPreview(sUrl);
          }

          const rawTop = Array.isArray(p.top_books) ? p.top_books : [];
          setTopBooks(
            Array.from({ length: 10 }, (_, i) => {
              const rank = i + 1;
              const found = rawTop.find((item: any) => item.rank === rank);
              return {
                rank,
                book_id: found?.book_id || "",
                note: found?.note || "",
              };
            }),
          );
        }
      }
    } catch (e) {
      console.warn("Failed to load about data:", e);
    }
  }

  // Load reviews and blogs from API
  async function loadAllData() {
    setLoading(true);
    try {
      const [revRes, blogRes] = await Promise.all([
        fetch("/api/admin/reviews"),
        fetch("/api/admin/blog-posts"),
        loadAboutData(),
      ]);

      if (revRes.ok) {
        const revJson = await revRes.json();
        if (revJson.success && Array.isArray(revJson.data)) {
          setReviews(revJson.data);
        }
      }

      if (blogRes.ok) {
        const blogJson = await blogRes.json();
        if (blogJson.success && Array.isArray(blogJson.data)) {
          setBlogPosts(blogJson.data);
        }
      }
    } catch {
      setNotice({ type: "error", text: "ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้" });
    } finally {
      setLoading(false);
    }
  }

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      const matchesGenre =
        genreFilter === "all" || item.genre_slug === genreFilter;
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${item.book_title} ${item.english_title || ""} ${item.author} ${item.summary} ${item.code}`
          .toLowerCase()
          .includes(q);
      return matchesGenre && matchesStatus && matchesSearch;
    });
  }, [reviews, genreFilter, statusFilter, search]);

  // Open Review Editor for Create or Edit
  function openReviewEditor(item?: AdminReviewItem) {
    setRichImageUploading(false);
    setCoverFile(null);
    setCoverPreview(null);
    if (item) {
      setEditingReviewId(item.review_id);
      setEditingBookId(item.book_id);
      setReviewForm({
        book_title: item.book_title,
        english_title: item.english_title || "",
        author: item.author,
        translator: item.translator || "",
        publisher: item.publisher || "",
        page_count: item.page_count || "",
        synopsis: item.synopsis || item.summary,
        cover_path: item.cover_path || "",
        review_title: item.review_title,
        slug: item.review_slug,
        summary: item.summary,
        content: item.content || "",
        highlight_quote: item.highlight_quote || "",
        tags: item.tags ? item.tags.join(", ") : "",
        rating: item.rating,
        status: item.status,
        genre_slug: item.genre_slug,
        code: item.code,
        stamp_text: item.stamp_text,
        stamp_variant: item.stamp_variant || "amber",
        is_spotlight: item.is_spotlight,
      });
    } else {
      setEditingReviewId(null);
      setEditingBookId(null);
      setReviewForm({
        ...EMPTY_REVIEW_FORM,
        code: `CASE #${String(100 + reviews.length).padStart(3, "0")}`,
      });
    }
    setActiveSection("review_editor");
  }

  function handleCoverSelect(file: File | undefined) {
    if (!file) return;
    if (
      !["image/webp", "image/png", "image/jpeg"].includes(file.type) ||
      file.size > MAX_COVER_SOURCE_BYTES
    ) {
      setNotice({
        type: "error",
        text: "ใช้ภาพ WebP, PNG หรือ JPEG ต้นฉบับไม่เกิน 20 MB",
      });
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setNotice(null);
  }

  // Publish all draft books to public website
  async function handlePublishAll() {
    if (
      !window.confirm(
        "ต้องการเผยแพร่หนังสือฉบับร่างทั้งหมดสู่หน้าเว็บจริงใช่หรือไม่? หนังสือจะแสดงผลบนหน้าเว็บทันที",
      )
    )
      return;
    setPublishingAll(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/reviews/publish-all", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setNotice({
          type: "success",
          text:
            json.message || "เผยแพร่หนังสือทั้งหมดสู่หน้าเว็บเรียบร้อยแล้ว!",
        });
        await loadAllData();
      } else {
        setNotice({
          type: "error",
          text: json.error || "เกิดข้อผิดพลาดในการเผยแพร่",
        });
      }
    } catch {
      setNotice({ type: "error", text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    } finally {
      setPublishingAll(false);
    }
  }

  // Save Review (Create or Update)
  async function handleSaveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (richImageUploading) {
      setNotice({
        type: "info",
        text: "รออัปโหลดรูปในเนื้อหาให้เสร็จก่อนบันทึก",
      });
      return;
    }

    if (
      !reviewForm.book_title.trim() ||
      !reviewForm.author.trim() ||
      (reviewForm.status === "published" && !reviewForm.summary.trim())
    ) {
      setNotice({
        type: "error",
        text: "กรุณากรอกชื่อหนังสือ ผู้แต่ง และคำโปรยก่อนเผยแพร่",
      });
      return;
    }

    setLoading(true);
    setNotice(null);

    const payload = {
      title: reviewForm.book_title.trim(),
      english_title: reviewForm.english_title.trim() || null,
      author: reviewForm.author.trim(),
      translator: reviewForm.translator.trim() || null,
      publisher: reviewForm.publisher.trim() || null,
      page_count: Number(reviewForm.page_count) || null,
      synopsis: reviewForm.synopsis.trim() || reviewForm.summary.trim(),
      cover_path: reviewForm.cover_path || null,
      review_title:
        reviewForm.review_title.trim() ||
        `รีวิว ${reviewForm.book_title.trim()}`,
      slug:
        reviewForm.slug.trim() ||
        reviewForm.book_title.trim().toLowerCase().replace(/\s+/g, "-"),
      summary: reviewForm.summary.trim(),
      content: reviewForm.content,
      highlight_quote: reviewForm.highlight_quote.trim() || null,
      tags: reviewForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      rating: reviewForm.rating,
      status: reviewForm.status,
      genre_slug: reviewForm.genre_slug,
      code: reviewForm.code.trim(),
      stamp_text: reviewForm.stamp_text.trim(),
      stamp_variant: reviewForm.stamp_variant,
      is_spotlight: reviewForm.is_spotlight,
    };

    try {
      if (coverFile) {
        const preparedCover = await prepareCoverImage(coverFile);
        const extension = preparedCover.type === "image/jpeg" ? "jpg" : "webp";
        const path = `books/${crypto.randomUUID()}.${extension}`;
        const { data, error } = await createClient()
          .storage.from("book-covers")
          .upload(path, preparedCover, {
            contentType: preparedCover.type,
            cacheControl: "31536000",
            upsert: false,
          });
        if (error || !data) {
          if (error && /bucket not found/i.test(error.message)) {
            throw new Error(
              "ยังไม่มี Storage bucket ชื่อ book-covers ใน Supabase project นี้ กรุณารัน migration 202611230004_secure_covers.sql ก่อนอัปโหลดรูปปก",
            );
          }
          throw new Error(error?.message || "อัปโหลดภาพปกไม่สำเร็จ");
        }
        payload.cover_path = data.path;
      }

      if (editingReviewId && editingBookId) {
        // Update
        const res = await fetch("/api/admin/reviews", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            review_id: editingReviewId,
            book_id: editingBookId,
          }),
        });
        const json = await res.json();
        if (!json.success)
          throw new Error(json.error || "บันทึกข้อมูลไม่สำเร็จ");
        setNotice({
          type: "success",
          text: `อัปเดตรีวิว "${reviewForm.book_title}" เรียบร้อยแล้ว`,
        });
      } else {
        // Create
        const res = await fetch("/api/admin/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "สร้างรีวิวไม่สำเร็จ");
        setNotice({
          type: "success",
          text: `เพิ่มหนังสือและรีวิว "${reviewForm.book_title}" เรียบร้อยแล้ว`,
        });
      }

      await loadAllData();
      setCoverFile(null);
      setCoverPreview(null);
      setActiveSection("reviews");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotice({ type: "error", text: `เกิดข้อผิดพลาด: ${msg}` });
    } finally {
      setLoading(false);
    }
  }

  // Trigger Custom Delete Modal for Review
  function handleDeleteReview(item: AdminReviewItem) {
    setDeleteTarget({
      type: "review",
      id: item.review_id,
      bookId: item.book_id,
      title: item.book_title,
      author: item.author,
      genre_slug: item.genre_slug,
      code: item.code,
    });
  }

  // Open Blog Editor
  function openBlogEditor(post?: AdminBlogPost) {
    setRichImageUploading(false);
    setBlogCoverFile(null);
    setBlogCoverPreview(null);
    if (post) {
      setEditingBlogId(post.id);
      const textContent =
        post.sections?.[0]?.html ||
        post.sections
          ?.map(
            (s) =>
              `${s.heading ? `<h2>${escapeRichText(s.heading)}</h2>` : ""}${(s.paragraphs || []).map((p) => `<p>${escapeRichText(p)}</p>`).join("")}`,
          )
          .join("") ||
        "";
      setBlogForm({
        title: post.title,
        slug: post.slug,
        category: post.category,
        excerpt: post.excerpt,
        quote: post.quote || "",
        art_key: post.art_key || "morning",
        cover_path: post.cover_path || "",
        status: post.status,
        content: textContent,
      });
    } else {
      setEditingBlogId(null);
      setBlogForm(EMPTY_BLOG_FORM);
    }
    setActiveSection("blog_editor");
  }

  function handleBlogCoverSelect(file: File | undefined) {
    if (!file) return;
    if (
      !["image/webp", "image/png", "image/jpeg"].includes(file.type) ||
      file.size > MAX_COVER_SOURCE_BYTES
    ) {
      setNotice({
        type: "error",
        text: "ใช้ภาพ WebP, PNG หรือ JPEG ขนาดไม่เกิน 20 MB",
      });
      return;
    }
    setBlogCoverFile(file);
    setBlogCoverPreview(URL.createObjectURL(file));
    setNotice(null);
  }

  async function handleRichImageUpload(file: File) {
    const { url } = await uploadSiteImage(file);
    return url;
  }

  // Save Blog Post
  async function handleSaveBlog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (richImageUploading) {
      setNotice({
        type: "info",
        text: "รออัปโหลดรูปในเนื้อหาให้เสร็จก่อนบันทึก",
      });
      return;
    }
    if (!blogForm.title.trim() || !blogForm.excerpt.trim()) {
      setNotice({ type: "error", text: "กรุณากรอกหัวข้อและคำนำให้ครบถ้วน" });
      return;
    }

    setLoading(true);
    const sections = [{ html: blogForm.content }];

    const payload = {
      title: blogForm.title.trim(),
      slug: blogForm.slug.trim() || `post-${Date.now()}`,
      category: blogForm.category.trim(),
      excerpt: blogForm.excerpt.trim(),
      quote: blogForm.quote.trim() || null,
      art_key: blogForm.art_key,
      cover_path: blogForm.cover_path || null,
      status: blogForm.status,
      sections,
    };

    let uploadedCoverPath: string | null = null;
    let saved = false;
    try {
      if (blogCoverFile) {
        const uploaded = await uploadSiteImage(blogCoverFile);
        payload.cover_path = uploaded.path;
        uploadedCoverPath = uploaded.path;
      }
      if (editingBlogId) {
        const res = await fetch("/api/admin/blog-posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingBlogId }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        saved = true;
        setNotice({
          type: "success",
          text: `อัปเดตบทความ "${blogForm.title}" สำเร็จ`,
        });
      } else {
        const res = await fetch("/api/admin/blog-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        saved = true;
        setNotice({
          type: "success",
          text: `สร้างบทความ "${blogForm.title}" สำเร็จ`,
        });
      }

      await loadAllData();
      setBlogCoverFile(null);
      setBlogCoverPreview(null);
      setActiveSection("blogs");
    } catch (err: unknown) {
      if (uploadedCoverPath && !saved) {
        try {
          await createClient()
            .storage.from("book-covers")
            .remove([uploadedCoverPath]);
        } catch {
          /* Keep the original save error. */
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      setNotice({ type: "error", text: `เกิดข้อผิดพลาด: ${msg}` });
    } finally {
      setLoading(false);
    }
  }

  // Trigger Custom Delete Modal for Blog Post
  function handleDeleteBlog(post: AdminBlogPost) {
    setDeleteTarget({
      type: "blog",
      id: post.id,
      title: post.title,
      category: post.category,
    });
  }

  // Execute Deletion from Modal
  async function confirmDelete() {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      if (deleteTarget.type === "review") {
        const res = await fetch(
          `/api/admin/reviews?review_id=${encodeURIComponent(deleteTarget.id)}`,
          {
            method: "DELETE",
          },
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ");
        setNotice({
          type: "success",
          text: `ลบรีวิว "${deleteTarget.title}" เรียบร้อยแล้ว`,
        });
      } else {
        const res = await fetch(`/api/admin/blog-posts?id=${deleteTarget.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ");
        setNotice({
          type: "success",
          text: `ลบบทความ "${deleteTarget.title}" เรียบร้อยแล้ว`,
        });
      }

      setDeleteTarget(null);
      await loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotice({ type: "error", text: `ลบไม่สำเร็จ: ${msg}` });
    } finally {
      setLoading(false);
    }
  }

  // Copy SQL script for RLS permission
  function copySqlScript() {
    const sql = `GRANT ALL ON public.books, public.reviews, public.genre_shelf_items, public.blog_posts, public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "allow_all_books" ON public.books;
CREATE POLICY "allow_all_books" ON public.books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_reviews" ON public.reviews;
CREATE POLICY "allow_all_reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_shelf" ON public.genre_shelf_items;
CREATE POLICY "allow_all_shelf" ON public.genre_shelf_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_blog" ON public.blog_posts;
CREATE POLICY "allow_all_blog" ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  }

  // About Page Handlers
  async function handleAvatarChange(file: File) {
    setAvatarUploading(true);
    try {
      const uploaded = await uploadSiteImage(file);
      setAboutForm((prev) => ({ ...prev, avatar_path: uploaded.path }));
      setAvatarPreview(uploaded.url);
      setNotice({ type: "success", text: "อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotice({ type: "error", text: `อัปโหลดรูปไม่สำเร็จ: ${msg}` });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveAbout(e: FormEvent) {
    e.preventDefault();
    setAboutSaving(true);
    try {
      const payload = {
        name: aboutForm.name,
        tagline: aboutForm.tagline,
        avatar_path: aboutForm.avatar_path || null,
        headline: aboutForm.headline,
        bio_intro: aboutForm.bio_intro,
        story: aboutForm.story,
        favorite_quote: aboutForm.favorite_quote,
        quote_author: aboutForm.quote_author,
        contact_email: aboutForm.contact_email,
        social_links: {
          goodreads: aboutForm.social_goodreads,
          instagram: aboutForm.social_instagram,
          facebook: aboutForm.social_facebook,
          github: aboutForm.social_github,
        },
        top_books: topBooks.filter((b) => b.book_id),
      };

      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setNotice({
          type: "success",
          text: "บันทึกข้อมูลหน้า About & Top 10 เรียบร้อยแล้ว!",
        });
      } else {
        if (json.error && json.error.includes("about_profile")) {
          setNotice({
            type: "error",
            text: "ยังไม่ได้รัน SQL สร้างตาราง about_profile ใน Supabase กรุณารัน migration 008 ใน SQL Editor ก่อน",
          });
        } else {
          setNotice({
            type: "error",
            text: json.error || "เกิดข้อผิดพลาดในการบันทึก",
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotice({ type: "error", text: `บันทึกไม่สำเร็จ: ${msg}` });
    } finally {
      setAboutSaving(false);
    }
  }

  // Sign out
  async function signOut() {
    sessionStorage.removeItem("bokk-demo-session");
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push("/login");
  }

  if (!ready) {
    return accessIssue ? (
      <div className="workspace admin-access-state">
        <div className="admin-access-card">
          <FamilyLogo />
          <h1>ยังเปิดหน้าแอดมินไม่ได้</h1>
          <p>{accessIssue}</p>
          {userEmail && (
            <p className="admin-access-email">บัญชีที่ใช้: {userEmail}</p>
          )}
          <div>
            <Link href="/">กลับหน้าแรก</Link>
            <button type="button" onClick={signOut}>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="workspace admin-loading">กำลังเปิดแผงควบคุมระบบ…</div>
    );
  }

  return (
    <div className="workspace admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <Link
          href="/"
          className="workspace-brand admin-brand"
          aria-label="Family JS หน้าแรก"
        >
          <FamilyLogo />
        </Link>
        <div className="admin-workspace-label">
          <span>WORKSPACE</span>
          <strong>แผงควบคุมหลัก</strong>
        </div>

        <nav aria-label="เมนูแอดมิน" className="admin-menu">
          <button
            type="button"
            onClick={() => setActiveSection("overview")}
            className={activeSection === "overview" ? "active" : ""}
          >
            <LayoutDashboard size={19} />
            <span>ภาพรวม</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("reviews")}
            className={activeSection === "reviews" ? "active" : ""}
          >
            <LibraryBig size={19} />
            <span>จัดการรีวิว & หนังสือ</span>
            <small>{reviews.length}</small>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("blogs")}
            className={activeSection === "blogs" ? "active" : ""}
          >
            <Newspaper size={19} />
            <span>จัดการบล็อก</span>
            <small>{blogPosts.length}</small>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection("about");
              loadAboutData();
            }}
            className={activeSection === "about" ? "active" : ""}
          >
            <UserCheck size={19} />
            <span>เกี่ยวกับเรา &amp; Top 10</span>
          </button>
          <button
            type="button"
            onClick={() => openReviewEditor()}
            className={activeSection === "review_editor" ? "active" : ""}
          >
            <Plus size={19} />
            <span>เพิ่มรีวิวใหม่</span>
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-demo-badge">
            <strong>
              {userEmail ? "SUPABASE LIVE DB" : "ADMIN WORKSPACE"}
            </strong>
            <span>{userEmail || "เชื่อมต่อกับฐานข้อมูล Supabase"}</span>
          </div>
          <button type="button" onClick={signOut} className="admin-signout">
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Wrap */}
      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div>
            <span className="workspace-eyebrow">
              FAMILY JS / ADMIN WORKSPACE
            </span>
            <strong>
              {activeSection === "overview" && "ภาพรวมของระบบ"}
              {activeSection === "reviews" && "จัดการรีวิวและคลังหนังสือ"}
              {activeSection === "blogs" && "จัดการบทความบล็อก"}
              {activeSection === "about" &&
                "จัดการหน้าเกี่ยวกับเรา (About Me) และ 10 อันดับหนังสือในดวงใจ"}
              {activeSection === "review_editor" &&
                (editingReviewId
                  ? "แก้ไขรีวิวหนังสือ"
                  : "เขียนรีวิวและเพิ่มหนังสือใหม่")}
              {activeSection === "blog_editor" &&
                (editingBlogId ? "แก้ไขบทความบล็อก" : "สร้างบทความบล็อกใหม่")}
            </strong>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/" className="admin-public-link" target="_blank">
              ดูหน้าเว็บจริง{" "}
              <ExternalLink
                size={14}
                style={{ display: "inline", verticalAlign: "middle" }}
              />
            </Link>
            <button
              type="button"
              className="admin-topbar-signout"
              onClick={signOut}
              aria-label="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>
            <span className="admin-avatar">
              {userEmail ? userEmail.slice(0, 2).toUpperCase() : "FJ"}
            </span>
          </div>
        </header>

        <main className="admin-content">
          {/* Notifications */}
          {notice && (
            <div
              className={`admin-notice ${notice.type === "error" ? "bg-red-50 text-red-700 border-red-200" : ""}`}
              role="status"
            >
              <span>{notice.text}</span>
              <button
                type="button"
                aria-label="ปิดข้อความ"
                onClick={() => setNotice(null)}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. OVERVIEW SECTION                                            */}
          {/* ============================================================== */}
          {activeSection === "overview" && (
            <>
              <div className="admin-page-heading">
                <div>
                  <p className="workspace-eyebrow">CONTROL CENTER</p>
                  <h1>ภาพรวมคลังหนังสือ</h1>
                  <p>
                    จัดการหนังสือ รีวิว บทความ และตำแหน่งจัดวางประจำธีมทั้งหมด
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {reviews.some((r) => r.status === "draft") && (
                    <button
                      type="button"
                      className="workspace-primary-button"
                      style={{ background: "#059669", borderColor: "#047857" }}
                      onClick={handlePublishAll}
                      disabled={publishingAll}
                      title="นำหนังสือฉบับร่างทั้งหมดไปแสดงบนหน้าเว็บ"
                    >
                      {publishingAll ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Sparkles size={18} />
                      )}
                      {publishingAll
                        ? "กำลังเผยแพร่..."
                        : `เผยแพร่สู่หน้าเว็บ (${reviews.filter((r) => r.status === "draft").length} เล่ม)`}
                    </button>
                  )}
                  <button
                    type="button"
                    className="workspace-primary-button"
                    onClick={() => openReviewEditor()}
                  >
                    <Plus size={18} /> เพิ่มรีวิวใหม่
                  </button>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => openBlogEditor()}
                  >
                    <Newspaper size={18} /> เขียนบล็อก
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="admin-stats">
                <div className="admin-stat-card">
                  <span>รีวิวหนังสือทั้งหมด</span>
                  <strong>{reviews.length}</strong>
                  <small>
                    {reviews.filter((r) => r.status === "published").length}{" "}
                    เผยแพร่แล้ว ·{" "}
                    {reviews.filter((r) => r.status === "draft").length} ร่าง
                  </small>
                </div>
                <div className="admin-stat-card">
                  <span>บทความบล็อก</span>
                  <strong>{blogPosts.length}</strong>
                  <small>เรื่องเล่าและบทความทั่วไป</small>
                </div>
                <div className="admin-stat-card">
                  <span>ธีมและหมวดหมู่</span>
                  <strong>{GENRE_IDS.length}</strong>
                  <small>สืบสวน, คลาสสิก, กำลังภายใน, นิยายรัก, มังงะ</small>
                </div>
              </div>

              {/* Publish Banner for Drafts */}
              {reviews.filter((r) => r.status === "draft").length > 0 && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        color: "#065f46",
                        fontSize: "15px",
                        display: "block",
                      }}
                    >
                      📢 พบหนังสือฉบับร่าง{" "}
                      {reviews.filter((r) => r.status === "draft").length} เล่ม
                      ที่ยังไม่ได้แสดงบนหน้าเว็บสาธารณะ
                    </strong>
                    <span style={{ color: "#047857", fontSize: "13px" }}>
                      กดปุ่มเผยแพร่เพื่อให้หนังสือทั้ง{" "}
                      {reviews.filter((r) => r.status === "draft").length}{" "}
                      เล่มไปปรากฏบนชั้นวางหนังสือของแต่ละหมวดทันที
                    </span>
                  </div>
                  <button
                    type="button"
                    className="workspace-primary-button"
                    style={{ background: "#059669", borderColor: "#047857" }}
                    onClick={handlePublishAll}
                    disabled={publishingAll}
                  >
                    {publishingAll
                      ? "กำลังประมวลผล..."
                      : "🚀 เผยแพร่ทั้งหมดสู่หน้าเว็บทันที"}
                  </button>
                </div>
              )}

              <div className="admin-overview-grid">
                {/* Genres Grid */}
                <section className="admin-surface">
                  <div className="admin-surface-heading">
                    <div>
                      <p className="workspace-eyebrow">GENRES & SHELVES</p>
                      <h2>หมวดหมู่และธีมประจำเว็บ</h2>
                    </div>
                  </div>
                  <div className="admin-category-grid">
                    {GENRE_IDS.map((id) => {
                      const count = reviews.filter(
                        (r) => r.genre_slug === id,
                      ).length;
                      return (
                        <Link
                          href={`/genre/${id}`}
                          key={id}
                          className={`admin-category admin-category-${id}`}
                          target="_blank"
                        >
                          <span>{GENRE_THEMES[id].englishName}</span>
                          <strong>{GENRE_THEMES[id].name}</strong>
                          <small>{count} เล่มบนชั้น</small>
                        </Link>
                      );
                    })}
                  </div>
                </section>

                {/* Latest Reviews */}
                <section className="admin-surface admin-latest">
                  <div className="admin-surface-heading">
                    <div>
                      <p className="workspace-eyebrow">RECENT ENTRIES</p>
                      <h2>รีวิวล่าสุด</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection("reviews")}
                    >
                      ดูทั้งหมด
                    </button>
                  </div>
                  {reviews.length ? (
                    reviews.slice(0, 4).map((item) => (
                      <div
                        key={item.review_id}
                        className="admin-latest-row"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            minWidth: 0,
                          }}
                        >
                          <span
                            className={`admin-mini-cover mini-${item.genre_slug}`}
                          >
                            <BookOpenText size={21} />
                          </span>
                          <span style={{ overflow: "hidden" }}>
                            <strong>{item.book_title}</strong>
                            <small>
                              {GENRE_THEMES[item.genre_slug].name} ·{" "}
                              {item.rating === null
                                ? "ยังไม่ให้คะแนน"
                                : `★ ${item.rating.toFixed(1)}`}
                            </small>
                          </span>
                        </div>
                        <button
                          type="button"
                          className="admin-btn-action btn-edit"
                          onClick={() => openReviewEditor(item)}
                          title="แก้ไข"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="admin-empty-small">
                      <BookOpenText size={30} />
                      <p>ยังไม่มีข้อมูลรีวิวในระบบ</p>
                      <button type="button" onClick={() => openReviewEditor()}>
                        เพิ่มเล่มแรก
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 2. REVIEWS & BOOKS LIST (CRUD READ & ACTIONS)                 */}
          {/* ============================================================== */}
          {activeSection === "reviews" && (
            <>
              <div className="admin-page-heading">
                <div>
                  <p className="workspace-eyebrow">COLLECTION MANAGEMENT</p>
                  <h1>จัดการรีวิวและหนังสือ</h1>
                  <p>สร้าง แก้ไข ลบ และจัดวางตำแหน่งบนชั้นวางของแต่ละธีม</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {reviews.some((r) => r.status === "draft") && (
                    <button
                      type="button"
                      className="workspace-primary-button"
                      style={{ background: "#059669", borderColor: "#047857" }}
                      onClick={handlePublishAll}
                      disabled={publishingAll}
                      title="นำหนังสือฉบับร่างทั้งหมดไปแสดงบนหน้าเว็บ"
                    >
                      {publishingAll ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Sparkles size={18} />
                      )}
                      {publishingAll
                        ? "กำลังเผยแพร่..."
                        : `เผยแพร่ทั้งหมด (${reviews.filter((r) => r.status === "draft").length} เล่ม)`}
                    </button>
                  )}
                  <button
                    type="button"
                    className="workspace-primary-button"
                    onClick={() => openReviewEditor()}
                  >
                    <Plus size={18} /> เพิ่มหนังสือ & รีวิวใหม่
                  </button>
                </div>
              </div>

              <div className="admin-surface">
                {/* Status Tabs */}
                <div className="admin-tabs">
                  <button
                    type="button"
                    className={`admin-tab-btn ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    ทั้งหมด ({reviews.length})
                  </button>
                  <button
                    type="button"
                    className={`admin-tab-btn ${statusFilter === "published" ? "active" : ""}`}
                    onClick={() => setStatusFilter("published")}
                  >
                    เผยแพร่แล้ว (
                    {reviews.filter((r) => r.status === "published").length})
                  </button>
                  <button
                    type="button"
                    className={`admin-tab-btn ${statusFilter === "draft" ? "active" : ""}`}
                    onClick={() => setStatusFilter("draft")}
                  >
                    ฉบับร่าง (
                    {reviews.filter((r) => r.status === "draft").length})
                  </button>
                </div>

                {/* Filters */}
                <div className="admin-filters">
                  <label className="admin-search">
                    <Search size={19} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ค้นหาชื่อหนังสือ, ผู้เขียน, คำโปรย หรือรหัสบนชั้น..."
                    />
                  </label>
                  <label className="admin-select">
                    <select
                      value={genreFilter}
                      onChange={(e) =>
                        setGenreFilter(e.target.value as GenreId | "all")
                      }
                    >
                      <option value="all">ทุกหมวดหมู่ (All Genres)</option>
                      {GENRE_IDS.map((id) => (
                        <option value={id} key={id}>
                          {GENRE_THEMES[id].name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Table List */}
                <div className="admin-library-list">
                  {filteredReviews.map((item) => (
                    <article className="admin-library-row" key={item.review_id}>
                      <span
                        className={`admin-mini-cover mini-${item.genre_slug}`}
                      >
                        <BookOpenText size={22} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <h2>{item.book_title}</h2>
                          {item.english_title && (
                            <span
                              style={{ color: "#878290", fontSize: "0.85rem" }}
                            >
                              ({item.english_title})
                            </span>
                          )}
                          {item.is_spotlight && (
                            <span className="admin-badge-spotlight">
                              <Sparkles
                                size={11}
                                style={{ marginRight: "3px" }}
                              />{" "}
                              SPOTLIGHT
                            </span>
                          )}
                          <span
                            className={
                              item.status === "published"
                                ? "admin-badge-published"
                                : "admin-badge-draft"
                            }
                          >
                            {item.status === "published"
                              ? "เผยแพร่แล้ว"
                              : "ฉบับร่าง"}
                          </span>
                        </div>
                        <p>
                          {item.author} · {GENRE_THEMES[item.genre_slug].name} ·
                          รหัส: <code>{item.code}</code> · ตรา:{" "}
                          <strong>{item.stamp_text}</strong>
                        </p>
                      </div>

                      <span className="admin-library-rating">
                        {item.rating === null
                          ? "ยังไม่ให้คะแนน"
                          : `★ ${item.rating.toFixed(1)}`}
                      </span>

                      <div className="admin-actions-cell">
                        <Link
                          href={`/genre/${item.genre_slug}`}
                          target="_blank"
                          className="admin-btn-action"
                          title="ดูบนหน้าเว็บจริง"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          type="button"
                          className="admin-btn-action btn-edit"
                          onClick={() => openReviewEditor(item)}
                          title="แก้ไขรีวิวและหนังสือ"
                        >
                          <Edit size={16} />
                        </button>
                        {userRole === "admin" && (
                          <button
                            type="button"
                            className="admin-btn-action btn-delete"
                            onClick={() => handleDeleteReview(item)}
                            title="ลบรีวิวนี้"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}

                  {filteredReviews.length === 0 && (
                    <div className="admin-empty-small">
                      <Search size={30} />
                      <p>ไม่พบรีวิวที่ตรงกับเงื่อนไขการค้นหา</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 3. BLOG POSTS LIST (CRUD READ & ACTIONS)                       */}
          {/* ============================================================== */}
          {activeSection === "blogs" && (
            <>
              <div className="admin-page-heading">
                <div>
                  <p className="workspace-eyebrow">STORIES & ESSAYS</p>
                  <h1>จัดการบทความบล็อก</h1>
                  <p>เขียนบทความทั่วไป เรื่องเล่าประจำวัน บันทึก และแนวคิด</p>
                </div>
                <button
                  type="button"
                  className="workspace-primary-button"
                  onClick={() => openBlogEditor()}
                >
                  <Plus size={18} /> เขียนบทความใหม่
                </button>
              </div>

              <div className="admin-surface">
                <div className="admin-blog-list">
                  {blogPosts.map((post) => (
                    <div className="admin-blog-row" key={post.id}>
                      <div className="admin-blog-info">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span className="admin-badge-category">
                            {post.category}
                          </span>
                          <span
                            className={
                              post.status === "published"
                                ? "admin-badge-published"
                                : "admin-badge-draft"
                            }
                          >
                            {post.status === "published"
                              ? "เผยแพร่แล้ว"
                              : "ฉบับร่าง"}
                          </span>
                          <span
                            style={{ fontSize: "0.78rem", color: "#928e98" }}
                          >
                            /{post.slug}
                          </span>
                        </div>
                        <h3>{post.title}</h3>
                        <p>{post.excerpt}</p>
                        <div className="admin-blog-meta">
                          <span>
                            สร้างเมื่อ{" "}
                            {new Date(post.created_at).toLocaleDateString(
                              "th-TH",
                            )}
                          </span>
                          {post.quote && (
                            <span>· &ldquo;{post.quote}&rdquo;</span>
                          )}
                        </div>
                      </div>

                      <div className="admin-actions-cell">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="admin-btn-action"
                          title="อ่านบนเว็บ"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          type="button"
                          className="admin-btn-action btn-edit"
                          onClick={() => openBlogEditor(post)}
                          title="แก้ไขบทความ"
                        >
                          <Edit size={16} />
                        </button>
                        {userRole === "admin" && (
                          <button
                            type="button"
                            className="admin-btn-action btn-delete"
                            onClick={() => handleDeleteBlog(post)}
                            title="ลบบทความ"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {blogPosts.length === 0 && (
                    <div className="admin-empty-small">
                      <Newspaper size={30} />
                      <p>ยังไม่มีบทความในระบบ</p>
                      <button type="button" onClick={() => openBlogEditor()}>
                        เริ่มเขียนบทความแรก
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* 4. REVIEW & BOOK EDITOR (CREATE / UPDATE)                      */}
          {/* ============================================================== */}
          {activeSection === "review_editor" && (
            <>
              <div className="admin-page-heading">
                <div>
                  <p className="workspace-eyebrow">EDITORIAL WORKSPACE</p>
                  <h1>
                    {editingReviewId
                      ? `แก้ไขรีวิว: ${reviewForm.book_title}`
                      : "เขียนรีวิวและเพิ่มหนังสือใหม่"}
                  </h1>
                  <p>
                    บันทึกข้อมูลเข้าสู่ฐานข้อมูล Supabase
                    และแสดงผลบนหน้าเว็บทันที
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setActiveSection("reviews")}
                >
                  กลับไปหน้ารายการ
                </button>
              </div>

              <form className="admin-editor" onSubmit={handleSaveReview}>
                {/* ส่วนที่ 1: ข้อมูลหนังสือ */}
                <div className="admin-surface" style={{ marginBottom: "20px" }}>
                  <div className="admin-surface-heading">
                    <div>
                      <p className="workspace-eyebrow">STEP 1</p>
                      <h2>1. ข้อมูลหนังสือ (Book Information)</h2>
                    </div>
                  </div>
                  <div className="admin-form-grid">
                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="form-book-title">
                        ชื่อหนังสือ (ภาษาไทย) <span>*</span>
                      </label>
                      <input
                        id="form-book-title"
                        required
                        value={reviewForm.book_title}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            book_title: e.target.value,
                          })
                        }
                        placeholder="ชื่อหนังสือ"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-english-title">
                        ชื่อภาษาอังกฤษ / ชื่อต้นฉบับ
                      </label>
                      <input
                        id="form-english-title"
                        value={reviewForm.english_title}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            english_title: e.target.value,
                          })
                        }
                        placeholder="ชื่อภาษาอังกฤษ (ถ้ามี)"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-author">
                        ผู้เขียน (Author) <span>*</span>
                      </label>
                      <input
                        id="form-author"
                        required
                        value={reviewForm.author}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            author: e.target.value,
                          })
                        }
                        placeholder="ชื่อผู้เขียน"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-translator">
                        ผู้แปล (Translator)
                      </label>
                      <input
                        id="form-translator"
                        value={reviewForm.translator}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            translator: e.target.value,
                          })
                        }
                        placeholder="ชื่อผู้แปล (ถ้ามี)"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-publisher">
                        สำนักพิมพ์ (Publisher)
                      </label>
                      <input
                        id="form-publisher"
                        value={reviewForm.publisher}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            publisher: e.target.value,
                          })
                        }
                        placeholder="เช่น น้ำพุสำนักพิมพ์, สมมติ"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-pages">จำนวนหน้า</label>
                      <input
                        id="form-pages"
                        type="number"
                        min="1"
                        value={reviewForm.page_count}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            page_count:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="form-cover">รูปปกหนังสือ</label>
                      <div className="admin-cover-upload">
                        <div className="admin-cover-preview">
                          {coverPreview || storedCoverUrl ? (
                            <Image
                              src={coverPreview || storedCoverUrl || ""}
                              alt={`ตัวอย่างปก ${reviewForm.book_title || "หนังสือ"}`}
                              width={104}
                              height={156}
                              unoptimized={Boolean(coverPreview)}
                            />
                          ) : (
                            <BookOpenText size={32} aria-hidden="true" />
                          )}
                        </div>
                        <div className="admin-cover-controls">
                          <input
                            id="form-cover"
                            type="file"
                            accept="image/webp,image/png,image/jpeg"
                            onChange={(event) => {
                              handleCoverSelect(event.currentTarget.files?.[0]);
                              event.currentTarget.value = "";
                            }}
                          />
                          <p>
                            แนะนำภาพแนวตั้งสัดส่วน 2:3 เพื่อให้พอดีปก
                            ระบบแสดงภาพเต็มกรอบและครอปจากกึ่งกลางเล็กน้อยหากสัดส่วนต่าง
                            รับ WebP, PNG หรือ JPEG ไม่เกิน 20 MB
                            และย่อก่อนอัปโหลด
                          </p>
                          {(coverFile || reviewForm.cover_path) && (
                            <button
                              type="button"
                              className="admin-cover-remove"
                              onClick={() => {
                                setCoverFile(null);
                                setCoverPreview(null);
                                setReviewForm((current) => ({
                                  ...current,
                                  cover_path: "",
                                }));
                              }}
                            >
                              เอารูปปกออก
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="form-synopsis">
                        เรื่องย่อ (Synopsis) <span>*</span>
                      </label>
                      <textarea
                        id="form-synopsis"
                        required
                        rows={4}
                        value={reviewForm.synopsis}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            synopsis: e.target.value,
                          })
                        }
                        placeholder="เรื่องย่อโดยสังเขปของหนังสือ..."
                      />
                    </div>
                  </div>
                </div>

                {/* ส่วนที่ 2: ข้อมูลรีวิว */}
                <div className="admin-surface" style={{ marginBottom: "20px" }}>
                  <div className="admin-surface-heading">
                    <div>
                      <p className="workspace-eyebrow">STEP 2</p>
                      <h2>2. ข้อมูลการรีวิว (Review Details)</h2>
                    </div>
                  </div>
                  <div className="admin-form-grid">
                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="form-review-title">หัวข้อรีวิว</label>
                      <input
                        id="form-review-title"
                        value={reviewForm.review_title}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            review_title: e.target.value,
                          })
                        }
                        placeholder="ชื่อรีวิว"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-slug">URL Slug</label>
                      <input
                        id="form-slug"
                        value={reviewForm.slug}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, slug: e.target.value })
                        }
                        placeholder="เช่น silent-patient-review"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-rating">
                        คะแนนความประทับใจ (Rating 1.0–5.0)
                      </label>
                      <select
                        id="form-rating"
                        value={reviewForm.rating ?? ""}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            rating:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      >
                        <option value="">ยังไม่ได้อ่าน / ยังไม่ให้คะแนน</option>
                        <option value={5.0}>
                          ★★★★★ 5.0 (ยอดเยี่ยม/Masterpiece)
                        </option>
                        <option value={4.5}>
                          ★★★★☆ 4.5 (ดีเยี่ยม/Recommended)
                        </option>
                        <option value={4.0}>★★★★☆ 4.0 (ดีมาก)</option>
                        <option value={3.5}>
                          ★★★☆☆ 3.5 (ปานกลางค่อนข้างดี)
                        </option>
                        <option value={3.0}>★★★☆☆ 3.0 (ปานกลาง)</option>
                        <option value={2.5}>★★☆☆☆ 2.5 (พอใช้)</option>
                        <option value={2.0}>★★☆☆☆ 2.0 (ต่ำกว่าเกณฑ์)</option>
                        <option value={1.0}>★☆☆☆☆ 1.0 (ไม่ประทับใจ)</option>
                      </select>
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-status">สถานะการเผยแพร่</label>
                      <select
                        id="form-status"
                        value={reviewForm.status}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            status: e.target.value as "published" | "draft",
                          })
                        }
                      >
                        <option value="published">
                          เผยแพร่ทันที (Published)
                        </option>
                        <option value="draft">บันทึกเป็นแบบร่าง (Draft)</option>
                      </select>
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-tags">แท็ก (คั่นด้วยจุลภาค)</label>
                      <input
                        id="form-tags"
                        value={reviewForm.tags}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, tags: e.target.value })
                        }
                        placeholder="เช่น จิตวิทยา, หักมุม, คดีฆาตกรรม"
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="form-highlight">
                        ประโยคไฮไลต์ / วรรคทอง (Highlight Quote)
                      </label>
                      <input
                        id="form-highlight"
                        value={reviewForm.highlight_quote}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            highlight_quote: e.target.value,
                          })
                        }
                        placeholder="เช่น สิ่งสำคัญไม่อาจเห็นได้ด้วยดวงตา หากต้องมองด้วยใจ..."
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="form-summary">
                        คำโปรยรีวิวสั้น <span>*</span>
                      </label>
                      <textarea
                        id="form-summary"
                        required
                        rows={6}
                        value={reviewForm.summary}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            summary: e.target.value,
                          })
                        }
                        placeholder="เขียนวิเคราะห์ ความรู้สึก ข้อคิดที่ได้ หรือจุดเด่นของหนังสือเล่มนี้..."
                      />
                    </div>
                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="review-content">
                        รายละเอียดรีวิวฉบับเต็ม
                      </label>
                      <RichTextEditor
                        key={`review-${editingReviewId || "new"}`}
                        id="review-content"
                        initialHtml={reviewForm.content}
                        onChange={(html) =>
                          setReviewForm((current) => ({
                            ...current,
                            content: html,
                          }))
                        }
                        onUploadImage={handleRichImageUpload}
                        onUploadStateChange={setRichImageUploading}
                        placeholder="เขียนรีวิวฉบับเต็ม"
                      />
                    </div>
                  </div>
                </div>

                {/* ส่วนที่ 3: การจัดวางบนชั้นวางประจำธีม */}
                <div className="admin-surface">
                  <div className="admin-surface-heading">
                    <div>
                      <p className="workspace-eyebrow">STEP 3</p>
                      <h2>3. เลือกตู้หนังสือและจัดวางบนชั้น (Cabinet Type)</h2>
                    </div>
                  </div>
                  <div className="admin-form-grid">
                    <div className="workspace-field">
                      <label htmlFor="form-genre">
                        ประเภท / ตู้หนังสือ <span>*</span>
                      </label>
                      <select
                        id="form-genre"
                        value={reviewForm.genre_slug}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            genre_slug: e.target.value as GenreId,
                          })
                        }
                      >
                        {GENRE_IDS.map((id) => (
                          <option key={id} value={id}>
                            {GENRE_THEMES[id].name} (
                            {GENRE_THEMES[id].englishName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-code">
                        รหัสบนชั้น / คดี / คัมภีร์
                      </label>
                      <input
                        id="form-code"
                        value={reviewForm.code}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, code: e.target.value })
                        }
                        placeholder="เช่น CASE #090, SCROLL #003"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-stamp-text">
                        ข้อความบนตราประทับ
                      </label>
                      <input
                        id="form-stamp-text"
                        value={reviewForm.stamp_text}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            stamp_text: e.target.value,
                          })
                        }
                        placeholder="เช่น MASTERPIECE, RECOMMENDED, EPIC"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="form-stamp-variant">โทนสีตราประทับ</label>
                      <select
                        id="form-stamp-variant"
                        value={reviewForm.stamp_variant}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            stamp_variant: e.target.value,
                          })
                        }
                      >
                        <option value="amber">สีทองอำพัน (Amber)</option>
                        <option value="crimson">สีแดงเข้ม (Crimson)</option>
                        <option value="emerald">สีเขียวหยก (Emerald)</option>
                        <option value="cyan">สีฟ้าไซเบอร์ (Cyan)</option>
                        <option value="purple">
                          สีม่วงลาเวนเดอร์ (Purple)
                        </option>
                      </select>
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label className="admin-checkbox-label">
                        <input
                          type="checkbox"
                          checked={reviewForm.is_spotlight}
                          onChange={(e) =>
                            setReviewForm({
                              ...reviewForm,
                              is_spotlight: e.target.checked,
                            })
                          }
                        />
                        <span>
                          ตั้งให้หนังสือเล่มนี้เป็น
                          &ldquo;เล่มเด่นประจำหมวด&rdquo; (Spotlight Book)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="admin-editor-bottom">
                  <p>
                    ข้อมูลจะถูกบันทึกและซิงค์กับฐานข้อมูล Supabase
                    และหน้าเว็บหลักทันที
                  </p>
                  <div>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => setActiveSection("reviews")}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="workspace-primary-button"
                      disabled={loading || richImageUploading}
                    >
                      {richImageUploading
                        ? "กำลังอัปโหลดรูป…"
                        : loading
                          ? "กำลังบันทึก…"
                          : editingReviewId
                            ? "บันทึกการแก้ไข"
                            : "เพิ่มหนังสือและรีวิว"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* ============================================================== */}
          {/* 5. BLOG POST EDITOR (CREATE / UPDATE)                          */}
          {/* ============================================================== */}
          {activeSection === "blog_editor" && (
            <>
              <div className="admin-page-heading">
                <div>
                  <p className="workspace-eyebrow">BLOG EDITOR</p>
                  <h1>
                    {editingBlogId
                      ? `แก้ไขบทความ: ${blogForm.title}`
                      : "เขียนบทความบล็อกใหม่"}
                  </h1>
                  <p>
                    แบ่งปันมุมมอง บันทึกเรื่องราว หรือความรู้สึกที่มีต่อการอ่าน
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setActiveSection("blogs")}
                >
                  กลับไปหน้ารายการ
                </button>
              </div>

              <form className="admin-editor" onSubmit={handleSaveBlog}>
                <div className="admin-surface">
                  <div className="admin-form-grid">
                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="blog-title">
                        หัวข้อบทความ <span>*</span>
                      </label>
                      <input
                        id="blog-title"
                        required
                        value={blogForm.title}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, title: e.target.value })
                        }
                        placeholder="เช่น เช้าวันที่ไม่ต้องรีบ กับกาแฟหนึ่งแก้ว"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="blog-slug">URL Slug</label>
                      <input
                        id="blog-slug"
                        value={blogForm.slug}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, slug: e.target.value })
                        }
                        placeholder="เช่น slow-morning"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="blog-category">หมวดหมู่บทความ</label>
                      <input
                        id="blog-category"
                        value={blogForm.category}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, category: e.target.value })
                        }
                        placeholder="เช่น ชีวิตประจำวัน, ไอเดีย, บันทึก"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="blog-status">สถานะการเผยแพร่</label>
                      <select
                        id="blog-status"
                        value={blogForm.status}
                        onChange={(e) =>
                          setBlogForm({
                            ...blogForm,
                            status: e.target.value as "published" | "draft",
                          })
                        }
                      >
                        <option value="published">
                          เผยแพร่ทันที (Published)
                        </option>
                        <option value="draft">บันทึกเป็นแบบร่าง (Draft)</option>
                      </select>
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="blog-art">ไอคอนธีมบทความ</label>
                      <select
                        id="blog-art"
                        value={blogForm.art_key}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, art_key: e.target.value })
                        }
                      >
                        <option value="morning">Morning (ยามเช้า)</option>
                        <option value="home">Home (บ้านและมุมโปรด)</option>
                        <option value="notes">Notes (บันทึกและปากกา)</option>
                        <option value="weekend">Weekend (วันหยุดอบอุ่น)</option>
                      </select>
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="blog-cover">รูปปกบทความ</label>
                      <div className="admin-blog-cover-upload">
                        <div className="admin-blog-cover-preview">
                          {blogCoverPreview || storedBlogCoverUrl ? (
                            <Image
                              src={blogCoverPreview || storedBlogCoverUrl || ""}
                              alt={`ตัวอย่างรูปปก ${blogForm.title || "บทความ"}`}
                              width={320}
                              height={180}
                              unoptimized={Boolean(blogCoverPreview)}
                            />
                          ) : (
                            <span>ภาพปกบทความ</span>
                          )}
                        </div>
                        <div className="admin-blog-cover-controls">
                          <button
                            type="button"
                            className="admin-blog-cover-pick"
                            onClick={() => blogCoverInput.current?.click()}
                          >
                            {blogCoverFile || blogForm.cover_path
                              ? "เปลี่ยนรูปจากเครื่อง"
                              : "เลือกรูปจากเครื่อง"}
                          </button>
                          <input
                            ref={blogCoverInput}
                            id="blog-cover"
                            className="admin-blog-cover-input"
                            type="file"
                            accept="image/webp,image/png,image/jpeg"
                            onChange={(event) => {
                              handleBlogCoverSelect(
                                event.currentTarget.files?.[0],
                              );
                              event.currentTarget.value = "";
                            }}
                          />
                          <span className="admin-blog-cover-filename">
                            {blogCoverFile
                              ? `${blogCoverFile.name} — กดบันทึกเพื่ออัปโหลด`
                              : blogForm.cover_path
                                ? "กำลังใช้รูปปกเดิม"
                                : "ยังไม่ได้เลือกรูป"}
                          </span>
                          <p>
                            แนะนำภาพแนวนอน 16:9 ไฟล์ต้นฉบับไม่เกิน 20 MB
                            ระบบจะย่อภาพก่อนอัปโหลด
                          </p>
                          {(blogCoverFile || blogForm.cover_path) && (
                            <button
                              type="button"
                              className="admin-cover-remove"
                              onClick={() => {
                                setBlogCoverFile(null);
                                setBlogCoverPreview(null);
                                setBlogForm((current) => ({
                                  ...current,
                                  cover_path: "",
                                }));
                              }}
                            >
                              เอารูปปกออก
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="blog-excerpt">
                        คำนำสรุป (Excerpt) <span>*</span>
                      </label>
                      <textarea
                        id="blog-excerpt"
                        required
                        rows={3}
                        value={blogForm.excerpt}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, excerpt: e.target.value })
                        }
                        placeholder="ข้อความสรุปสั้น ๆ ของบทความที่จะแสดงในการ์ดหน้ารวม..."
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="blog-quote">โควทไฮไลต์ (Quote)</label>
                      <input
                        id="blog-quote"
                        value={blogForm.quote}
                        onChange={(e) =>
                          setBlogForm({ ...blogForm, quote: e.target.value })
                        }
                        placeholder="เช่น ประโยคที่อยากเน้น..."
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="blog-content">เนื้อหาบทความ</label>
                      <RichTextEditor
                        key={`blog-${editingBlogId || "new"}`}
                        id="blog-content"
                        initialHtml={blogForm.content}
                        onChange={(html) =>
                          setBlogForm((current) => ({
                            ...current,
                            content: html,
                          }))
                        }
                        onUploadImage={handleRichImageUpload}
                        onUploadStateChange={setRichImageUploading}
                        placeholder="เขียนเนื้อหาบทความ"
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-editor-bottom">
                  <p>บทความจะแสดงในหน้า /blog ของเว็บไซต์</p>
                  <div>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => setActiveSection("blogs")}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="workspace-primary-button"
                      disabled={loading || richImageUploading}
                    >
                      {richImageUploading
                        ? "กำลังอัปโหลดรูป…"
                        : loading
                          ? "กำลังบันทึก…"
                          : editingBlogId
                            ? "บันทึกการแก้ไข"
                            : "เผยแพร่บทความ"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* ============================================================== */}
          {/* 6. ABOUT PROFILE & TOP 10 BOOKS EDITOR                         */}
          {/* ============================================================== */}
          {activeSection === "about" && (
            <>
              <div className="admin-page-heading">
                <div>
                  <p className="workspace-eyebrow">
                    ABOUT &amp; TOP 10 CURATION
                  </p>
                  <h1>จัดการหน้าเกี่ยวกับเรา &amp; 10 เล่มในดวงใจ</h1>
                  <p>
                    แก้ไขข้อมูลโปรไฟล์คนทำเว็บ เรื่องราวปรัชญาการอ่าน
                    และจัดอันดับ Top 10 หนังสือที่สุดในดวงใจ
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Link
                    href="/about"
                    target="_blank"
                    className="admin-secondary-button"
                  >
                    <ExternalLink size={16} /> ดูหน้า /about จริง
                  </Link>
                </div>
              </div>

              <form className="admin-editor" onSubmit={handleSaveAbout}>
                {/* 1. ข้อมูลผู้ดูแลเว็บ (Curator Profile) */}
                <div className="admin-surface" style={{ marginBottom: "24px" }}>
                  <div className="admin-surface-heading">
                    <div>
                      <p className="workspace-eyebrow">CURATOR PROFILE</p>
                      <h2>1. ข้อมูลผู้จัดทำ &amp; รูปโปรไฟล์</h2>
                    </div>
                  </div>

                  <div className="admin-form-grid">
                    {/* Avatar Upload */}
                    <div
                      className="workspace-field admin-field-wide"
                      style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "90px",
                          height: "90px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#2a222d",
                          border: "2px solid #573e55",
                          display: "grid",
                          placeItems: "center",
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <img
                            src="/family-js-mark.svg"
                            alt="Default Mark"
                            style={{
                              width: "48px",
                              height: "48px",
                              objectFit: "contain",
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: 600,
                          }}
                        >
                          รูปถ่ายคนทำ (Profile Photo)
                        </label>
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "#666",
                            marginBottom: "8px",
                          }}
                        >
                          แนะนำรูปสี่เหลี่ยมจัตุรัส จะถูกบันทึกลงใน Supabase
                          Storage (book-covers) อัตโนมัติ
                        </p>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAvatarChange(file);
                          }}
                        />
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={avatarUploading}
                          style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        >
                          <Upload size={15} />
                          {avatarUploading
                            ? "กำลังอัปโหลดรูป..."
                            : "เลือกรูปจากเครื่อง"}
                        </button>
                      </div>
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="about-name">
                        ชื่อผู้ดูแล / นามปากกา <span>*</span>
                      </label>
                      <input
                        id="about-name"
                        required
                        value={aboutForm.name}
                        onChange={(e) =>
                          setAboutForm({ ...aboutForm, name: e.target.value })
                        }
                        placeholder="เช่น Dong JS"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="about-tagline">
                        คำโปรยตำแหน่ง / สถานะ <span>*</span>
                      </label>
                      <input
                        id="about-tagline"
                        required
                        value={aboutForm.tagline}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            tagline: e.target.value,
                          })
                        }
                        placeholder="เช่น CURATOR · READER · DEVELOPER"
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="about-headline">
                        หัวข้อต้อนรับ (Headline) <span>*</span>
                      </label>
                      <input
                        id="about-headline"
                        required
                        value={aboutForm.headline}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            headline: e.target.value,
                          })
                        }
                        placeholder="เช่น ยินดีต้อนรับสู่บ้านหนังสือ Family JS"
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="about-bio">
                        คำแนะนำตัวสั้น (Bio Intro) <span>*</span>
                      </label>
                      <textarea
                        id="about-bio"
                        rows={3}
                        required
                        value={aboutForm.bio_intro}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            bio_intro: e.target.value,
                          })
                        }
                        placeholder="คำแนะนำตัวสั้น ๆ..."
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="about-story">
                        เรื่องราวที่มา (Origin Story) <span>*</span>
                      </label>
                      <textarea
                        id="about-story"
                        rows={5}
                        required
                        value={aboutForm.story}
                        onChange={(e) =>
                          setAboutForm({ ...aboutForm, story: e.target.value })
                        }
                        placeholder="เล่าจุดเริ่มต้นของเว็บ แยกย่อหน้าด้วยการเว้นวรรค 2 บรรทัด..."
                      />
                    </div>

                    <div className="workspace-field admin-field-wide">
                      <label htmlFor="about-quote">
                        โควทหนังสือประจำตัว (Favorite Quote)
                      </label>
                      <textarea
                        id="about-quote"
                        rows={2}
                        value={aboutForm.favorite_quote}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            favorite_quote: e.target.value,
                          })
                        }
                        placeholder="ประโยคจากหนังสือหรือคติการอ่านที่ชอบ..."
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="about-quote-author">เจ้าของโควท</label>
                      <input
                        id="about-quote-author"
                        value={aboutForm.quote_author}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            quote_author: e.target.value,
                          })
                        }
                        placeholder="เช่น Family JS"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="about-email">
                        อีเมลติดต่อ (Contact Email)
                      </label>
                      <input
                        id="about-email"
                        type="email"
                        value={aboutForm.contact_email}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            contact_email: e.target.value,
                          })
                        }
                        placeholder="dongjs.dev@gmail.com"
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="about-goodreads">
                        Goodreads Profile URL
                      </label>
                      <input
                        id="about-goodreads"
                        value={aboutForm.social_goodreads}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            social_goodreads: e.target.value,
                          })
                        }
                        placeholder="https://goodreads.com/..."
                      />
                    </div>

                    <div className="workspace-field">
                      <label htmlFor="about-instagram">
                        Instagram Profile URL
                      </label>
                      <input
                        id="about-instagram"
                        value={aboutForm.social_instagram}
                        onChange={(e) =>
                          setAboutForm({
                            ...aboutForm,
                            social_instagram: e.target.value,
                          })
                        }
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* 2. TOP 10 หนังสือที่สุดในดวงใจ */}
                <div className="admin-surface" style={{ marginBottom: "24px" }}>
                  <div className="admin-surface-heading">
                    <div>
                      <p className="workspace-eyebrow">ALL-TIME FAVORITES</p>
                      <h2>2. TOP 10 หนังสือที่สุดในดวงใจ</h2>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#666",
                          marginTop: "4px",
                        }}
                      >
                        เลือกหนังสือจากคลังจริงใน Supabase (มีทั้งหมด{" "}
                        {aboutBooksList.length} เล่ม) พร้อมเขียนความประทับใจสั้น
                        ๆ
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      marginTop: "16px",
                    }}
                  >
                    {topBooks.map((slot, index) => {
                      const rank = index + 1;
                      const badgeBg =
                        rank === 1
                          ? "#ffd700"
                          : rank === 2
                            ? "#e2e8f0"
                            : rank === 3
                              ? "#f6ad55"
                              : "#4a5568";
                      const badgeColor = rank <= 3 ? "#1a202c" : "#fff";
                      const selectedBook = aboutBooksList.find(
                        (b) => b.id === slot.book_id,
                      );

                      return (
                        <div
                          key={rank}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            background:
                              rank === 1
                                ? "#fffdf5"
                                : rank === 2
                                  ? "#fafafa"
                                  : rank === 3
                                    ? "#fffaf4"
                                    : "#ffffff",
                            border:
                              rank === 1
                                ? "2px solid #ecc94b"
                                : rank === 2
                                  ? "2px solid #cbd5e0"
                                  : rank === 3
                                    ? "2px solid #ed8936"
                                    : "1px solid #e2e8f0",
                            borderRadius: "16px",
                            padding: "18px 20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "14px",
                            }}
                          >
                            {/* Left: Rank Badge */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  width: "44px",
                                  height: "44px",
                                  lineHeight: "44px",
                                  textAlign: "center",
                                  borderRadius: "50%",
                                  background: badgeBg,
                                  color: badgeColor,
                                  fontWeight: 800,
                                  fontSize: "1.05rem",
                                  fontFamily: "var(--font-space-mono), monospace",
                                  boxShadow:
                                    rank <= 3
                                      ? "0 3px 10px rgba(0,0,0,0.12)"
                                      : "none",
                                }}
                              >
                                #{rank}
                              </span>
                              <div>
                                <strong
                                  style={{
                                    fontSize: "0.98rem",
                                    color: "#1f1823",
                                  }}
                                >
                                  {rank === 1
                                    ? "อันดับที่ 1 (สุดยอดในดวงใจ)"
                                    : rank === 2
                                      ? "อันดับที่ 2"
                                      : rank === 3
                                        ? "อันดับที่ 3"
                                        : `อันดับที่ ${rank}`}
                                </strong>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "0.78rem",
                                    color: "#716b76",
                                  }}
                                >
                                  {selectedBook
                                    ? "เลือกเล่มนี้แล้ว"
                                    : "ยังไม่ได้เลือกหนังสือ"}
                                </p>
                              </div>
                            </div>

                            {/* Action Button: Open Modal or Clear */}
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectingRankSlot(rank);
                                  setModalSearch("");
                                  setModalGenreFilter("all");
                                  if (aboutBooksList.length === 0) loadAboutData();
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: selectedBook
                                    ? "#f4ecf8"
                                    : "#8c57a8",
                                  color: selectedBook ? "#682f80" : "#ffffff",
                                  border: selectedBook
                                    ? "1px solid #d4bee0"
                                    : "none",
                                  padding: "8px 16px",
                                  borderRadius: "999px",
                                  fontSize: "0.86rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {selectedBook ? (
                                  <>
                                    <Edit size={14} /> เปลี่ยนเล่ม
                                  </>
                                ) : (
                                  <>
                                    <Search size={14} /> ค้นหาและเลือกเล่ม #{rank}
                                  </>
                                )}
                              </button>

                              {selectedBook && (
                                <button
                                  type="button"
                                  title="ล้างเล่มนี้"
                                  onClick={() => {
                                    setTopBooks((prev) =>
                                      prev.map((item) =>
                                        item.rank === rank
                                          ? { ...item, book_id: "", note: "" }
                                          : item,
                                      ),
                                    );
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    background: "#fee2e2",
                                    border: "none",
                                    color: "#b91c1c",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Selected Book Preview Card (if selected) */}
                          {selectedBook ? (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "54px 1fr",
                                gap: "14px",
                                alignItems: "center",
                                padding: "12px 14px",
                                borderRadius: "12px",
                                background: "#faf8fc",
                                border: "1px solid #e7deec",
                              }}
                            >
                              {/* Book Cover */}
                              <div
                                style={{
                                  width: "54px",
                                  height: "72px",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  background: "#312636",
                                  position: "relative",
                                  flexShrink: 0,
                                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                                }}
                              >
                                {selectedBook.cover_url ? (
                                  <img
                                    src={selectedBook.cover_url}
                                    alt={selectedBook.title}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      display: "grid",
                                      placeItems: "center",
                                      fontSize: "0.6rem",
                                      color: "#c3b5c7",
                                      textAlign: "center",
                                      padding: "2px",
                                    }}
                                  >
                                    ไม่มีรูป
                                  </div>
                                )}
                              </div>

                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize: "1rem",
                                      color: "#1f1823",
                                    }}
                                  >
                                    {selectedBook.title}
                                  </strong>
                                  {selectedBook.genre_slug &&
                                    GENRE_THEMES[
                                      selectedBook.genre_slug as GenreId
                                    ] && (
                                      <span
                                        style={{
                                          fontSize: "0.72rem",
                                          padding: "2px 8px",
                                          borderRadius: "999px",
                                          background: "#ede5f2",
                                          color: "#5b4767",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {
                                          GENRE_THEMES[
                                            selectedBook.genre_slug as GenreId
                                          ].name
                                        }
                                      </span>
                                    )}
                                </div>
                                <p
                                  style={{
                                    margin: "4px 0 0",
                                    fontSize: "0.85rem",
                                    color: "#6a6070",
                                  }}
                                >
                                  โดย {selectedBook.author || "ไม่ระบุผู้แต่ง"}
                                  {selectedBook.english_title
                                    ? ` · ${selectedBook.english_title}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setSelectingRankSlot(rank);
                                setModalSearch("");
                                setModalGenreFilter("all");
                                if (aboutBooksList.length === 0) loadAboutData();
                              }}
                              style={{
                                padding: "16px",
                                borderRadius: "12px",
                                border: "2px dashed #ded5e4",
                                background: "#fbfafc",
                                textAlign: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.88rem",
                                  color: "#7f7385",
                                }}
                              >
                                <Search
                                  size={15}
                                  style={{
                                    display: "inline",
                                    verticalAlign: "middle",
                                    marginRight: "6px",
                                  }}
                                />
                                ยังไม่มีเล่มที่เลือก — คลิกที่นี่เพื่อเปิดหน้าต่างค้นหาจาก{" "}
                                {aboutBooksList.length} เล่ม
                              </p>
                            </div>
                          )}

                          {/* Personal Note Input */}
                          <div style={{ marginTop: "4px" }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                marginBottom: "6px",
                                color: "#4a4250",
                              }}
                            >
                              ความรู้สึก / โน้ตสั้น ๆ สำหรับอันดับที่ #{rank}:
                            </label>
                            <input
                              value={slot.note}
                              onChange={(e) => {
                                const newNote = e.target.value;
                                setTopBooks((prev) =>
                                  prev.map((item) =>
                                    item.rank === rank
                                      ? { ...item, note: newNote }
                                      : item,
                                  ),
                                );
                              }}
                              placeholder="เช่น เล่มที่ทำให้เริ่มรักการอ่าน, พล็อตหักมุมจนวางไม่ลง, ข้อคิดดีมาก..."
                              style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "1px solid #d4ccd8",
                                fontSize: "0.9rem",
                                background: "#fff",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="admin-editor-bottom">
                  <p>
                    ข้อมูลจะถูกบันทึกเข้าสู่ตาราง about_profile และอัปเดตหน้า
                    /about ทันที
                  </p>
                  <div>
                    <button
                      type="submit"
                      className="workspace-primary-button"
                      disabled={aboutSaving}
                    >
                      {aboutSaving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />{" "}
                          กำลังบันทึกข้อมูล...
                        </>
                      ) : (
                        "บันทึกข้อมูล About & Top 10"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </main>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={() => !loading && setDeleteTarget(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div className="modal-icon-wrap">
                <AlertTriangle size={28} />
              </div>
              <button
                type="button"
                className="admin-btn-action"
                onClick={() => !loading && setDeleteTarget(null)}
                aria-label="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-header">
              <h3 id="modal-title">
                {deleteTarget.type === "review"
                  ? "ยืนยันการลบรีวิวหนังสือ?"
                  : "ยืนยันการลบบทความบล็อก?"}
              </h3>
              <p>
                คุณกำลังจะลบรายการนี้ออกจากฐานข้อมูล Supabase อย่างถาวร
                ข้อมูลและตำแหน่งที่จัดวางบนชั้นวางจะถูกนำออกทันทีและไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="modal-item-preview">
              {deleteTarget.type === "review" ? (
                <span
                  className={`admin-mini-cover mini-${deleteTarget.genre_slug}`}
                  style={{ width: "44px", height: "54px" }}
                >
                  <BookOpenText size={20} />
                </span>
              ) : (
                <div
                  style={{
                    width: "44px",
                    height: "54px",
                    borderRadius: "8px",
                    background: "#f3edf7",
                    display: "grid",
                    placeItems: "center",
                    color: "#6d4e81",
                  }}
                >
                  <Newspaper size={22} />
                </div>
              )}
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <strong
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {deleteTarget.title}
                </strong>
                {deleteTarget.type === "review" ? (
                  <span>
                    {deleteTarget.author} ·{" "}
                    {GENRE_THEMES[deleteTarget.genre_slug].name} (
                    {deleteTarget.code})
                  </span>
                ) : (
                  <span>หมวด: {deleteTarget.category}</span>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="modal-btn-delete"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                <span>{loading ? "กำลังลบ..." : "ยืนยันลบรายการนี้"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Book Picker Autocomplete Modal */}
      {selectingRankSlot !== null && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectingRankSlot(null)}
        >
          <div
            className="book-picker-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background:
                        selectingRankSlot === 1
                          ? "#ffd70025"
                          : selectingRankSlot === 2
                            ? "#cbd5e030"
                            : selectingRankSlot === 3
                              ? "#ed893625"
                              : "#71809620",
                      color:
                        selectingRankSlot === 1
                          ? "#b7791f"
                          : selectingRankSlot === 2
                            ? "#4a5568"
                            : selectingRankSlot === 3
                              ? "#c05621"
                              : "#4a5568",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      fontFamily: "var(--font-space-mono), monospace",
                    }}
                  >
                    อันดับที่ #{selectingRankSlot}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#1f1823",
                    }}
                  >
                    เลือกหนังสือที่สุดในดวงใจ
                  </h3>
                </div>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.86rem",
                    color: "#6b6271",
                  }}
                >
                  พิมพ์ค้นหาหรือกรองตามหมวดหมู่ (ทั้งหมด {aboutBooksList.length}{" "}
                  เล่ม)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectingRankSlot(null)}
                style={{
                  background: "#f3edf7",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  color: "#6b6271",
                }}
                aria-label="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input Bar (Auto-complete) */}
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#8c8291",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                autoFocus
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="พิมพ์ชื่อหนังสือ, ชื่อภาษาอังกฤษ หรือผู้เขียนเพื่อค้นหาทันที..."
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 42px",
                  borderRadius: "14px",
                  border: "2px solid #8c57a8",
                  fontSize: "0.95rem",
                  outline: "none",
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(140, 87, 168, 0.12)",
                }}
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#e2d9e6",
                    border: "none",
                    borderRadius: "50%",
                    width: "22px",
                    height: "22px",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    color: "#554c5a",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Genre Filter Chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(
                [
                  { id: "all", label: "ทั้งหมด" },
                  { id: "crime", label: "สืบสวน" },
                  { id: "classics", label: "คลาสสิก" },
                  { id: "romance", label: "โรแมนซ์" },
                  { id: "wuxia", label: "กำลังภายใน" },
                  { id: "manga", label: "มังงะ" },
                ] as const
              ).map((chip) => {
                const count =
                  chip.id === "all"
                    ? aboutBooksList.length
                    : aboutBooksList.filter((b) => b.genre_slug === chip.id)
                        .length;
                const active = modalGenreFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setModalGenreFilter(chip.id)}
                    style={{
                      padding: "4px 11px",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      border: active
                        ? "1px solid #7d4499"
                        : "1px solid #e2d9e6",
                      background: active ? "#7d4499" : "#f6f3f8",
                      color: active ? "#fff" : "#5d5462",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {chip.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Book List / Results */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.8rem",
                color: "#7a7180",
              }}
            >
              <span>
                พบ <strong>{filteredModalBooks.length}</strong> เล่ม
              </span>
              {filteredModalBooks.length > 0 && (
                <span style={{ fontSize: "0.75rem" }}>
                  คลิกที่เล่มเพื่อเลือกทันที
                </span>
              )}
            </div>

            <div
              className="book-picker-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                overflowY: "auto",
                maxHeight: "380px",
                paddingRight: "4px",
              }}
            >
              {filteredModalBooks.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#8a818f",
                  }}
                >
                  <BookOpenText
                    size={40}
                    style={{ margin: "0 auto 10px", opacity: 0.5 }}
                  />
                  <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                    ไม่พบหนังสือที่ตรงกับ &ldquo;{modalSearch}&rdquo;
                  </p>
                  <p style={{ fontSize: "0.82rem" }}>
                    ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น
                  </p>
                </div>
              ) : (
                filteredModalBooks.map((b) => {
                  const alreadyInSlot = topBooks.find(
                    (s) => s.book_id === b.id,
                  );
                  const isCurrentSlot =
                    alreadyInSlot?.rank === selectingRankSlot;

                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setTopBooks((prev) =>
                          prev.map((item) =>
                            item.rank === selectingRankSlot
                              ? { ...item, book_id: b.id }
                              : item,
                          ),
                        );
                        setSelectingRankSlot(null);
                      }}
                      className={`book-picker-item ${isCurrentSlot ? "is-selected" : ""}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr auto",
                        gap: "14px",
                        alignItems: "center",
                        padding: "10px 14px",
                        borderRadius: "14px",
                        border: isCurrentSlot
                          ? "2px solid #8c57a8"
                          : "1px solid #eae4ee",
                        background: isCurrentSlot ? "#f7effc" : "#faf8fb",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "48px",
                          height: "64px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          background: "#312636",
                          position: "relative",
                          flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      >
                        {b.cover_url ? (
                          <img
                            src={b.cover_url}
                            alt={b.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "0.6rem",
                              color: "#c3b5c7",
                              textAlign: "center",
                              padding: "2px",
                            }}
                          >
                            ไม่มีรูป
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "0.95rem",
                              color: "#1f1823",
                              lineHeight: 1.3,
                            }}
                          >
                            {b.title}
                          </strong>
                          {b.genre_slug &&
                            GENRE_THEMES[b.genre_slug as GenreId] && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  background: "#ece5f0",
                                  color: "#5e5265",
                                  fontWeight: 600,
                                }}
                              >
                                {GENRE_THEMES[b.genre_slug as GenreId].name}
                              </span>
                            )}
                        </div>
                        <p
                          style={{
                            margin: "3px 0 0",
                            fontSize: "0.82rem",
                            color: "#6a6070",
                          }}
                        >
                          โดย {b.author || "ไม่ระบุผู้แต่ง"}
                          {b.english_title ? ` · ${b.english_title}` : ""}
                        </p>
                      </div>

                      {/* Status / Select Button */}
                      <div>
                        {isCurrentSlot ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.78rem",
                              color: "#743594",
                              fontWeight: 700,
                              background: "#eddff5",
                              padding: "5px 12px",
                              borderRadius: "999px",
                            }}
                          >
                            <Check size={14} /> กำลังเลือก
                          </span>
                        ) : alreadyInSlot ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#9b7829",
                              background: "#fef3c7",
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontWeight: 600,
                            }}
                          >
                            อันดับ #{alreadyInSlot.rank}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#743594",
                              fontWeight: 600,
                              background: "#fff",
                              border: "1px solid #d4c5dc",
                              padding: "5px 12px",
                              borderRadius: "8px",
                            }}
                          >
                            เลือก
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
