import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { contentRepository } from "@/lib/content/repository";
import { GenreNav } from "@/components/EditorialSite";
import MotionEffects from "@/components/MotionEffects";
import CurrentYear from "@/components/CurrentYear";
import { GENRE_THEMES, type GenreId } from "@/lib/genres-data";
import {
  BookOpen,
  Coffee,
  Compass,
  ArrowRight,
  ShieldCheck,
  Library,
  Award,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา (About Me) & Top 10 หนังสือในดวงใจ | Family JS",
  description:
    "เรื่องราวของ Family JS พื้นที่บันทึกหนังสือ 178 เล่มและ 10 อันดับหนังสือที่สุดในดวงใจ โดย Dong JS",
};

const GENRE_LIST: { id: GenreId; symbol: string }[] = [
  { id: "crime", symbol: "✳" },
  { id: "classics", symbol: "❦" },
  { id: "wuxia", symbol: "山" },
  { id: "romance", symbol: "♡" },
  { id: "manga", symbol: "★" },
];

export default function AboutPage() {
  return (
    <Suspense
      fallback={
        <div className="bokk about-page">
          <MotionEffects />
          <GenreNav active="about" />
          <main
            style={{
              padding: "100px 24px",
              textAlign: "center",
              color: "#a79ba8",
            }}
          >
            <p className="eyebrow" style={{ marginBottom: "12px" }}>
              FAMILY JS / THE READING ROOM
            </p>
            <h2 style={{ fontSize: "1.6rem", color: "#fff", fontWeight: 600 }}>
              กำลังเปิดบ้านหนังสือ Family JS...
            </h2>
          </main>
          <footer className="bokk-footer">
            <span>
              FAMILY JS © <CurrentYear />
            </span>
            <Link href="/">หน้าแรก</Link>
            <Link href="/blog">บล็อกทั่วไป</Link>
            <Link href="/about">เกี่ยวกับเรา</Link>
            <span>STORIES · BOOKS · LIFE</span>
          </footer>
        </div>
      }
    >
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  await connection();
  const [stats, profile] = await Promise.all([
    contentRepository.getLibraryStats(),
    contentRepository.getAboutProfile(),
  ]);

  const topBooks = profile.top_books || [];

  return (
    <div className="bokk about-page">
      <MotionEffects />
      <GenreNav active="about" />

      <main>
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-grid">
            <div className="about-hero-copy">
              <p className="eyebrow">ABOUT THE CURATOR &amp; THE LIBRARY</p>
              <h1 style={{ whiteSpace: "pre-line" }}>{profile.headline}</h1>
              <p className="about-lead">{profile.bio_intro}</p>
            </div>

            <div className="about-avatar-card">
              <div className="about-avatar-mark">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-full"
                    priority
                  />
                ) : (
                  <Image
                    src="/family-js-mark.svg"
                    alt="Family JS Logo Mark"
                    width={52}
                    height={52}
                    priority
                  />
                )}
              </div>
              <h3>{profile.name}</h3>
              <p>{profile.tagline.toUpperCase()}</p>
              <span className="about-avatar-badge">
                ● LIVE LIBRARY: {stats.totalBooks} BOOKS
              </span>
            </div>
          </div>
        </section>

        {/* Live Stats */}
        <section className="about-stats-wrap">
          <div className="about-stats-grid">
            <div className="about-stat-box">
              <span>TOTAL BOOKS</span>
              <strong>{stats.totalBooks}</strong>
              <small>เล่มในคลังสะสม</small>
            </div>
            <div className="about-stat-box">
              <span>READING WORLDS</span>
              <strong>5</strong>
              <small>ตู้หนังสือ 5 บรรยากาศตามอารมณ์</small>
            </div>
            <div className="about-stat-box">
              <span>TOP PICKS</span>
              <strong>{topBooks.length || "10"}</strong>
              <small>เล่มโปรดคัดสรรที่สุดในดวงใจ</small>
            </div>
            <div className="about-stat-box">
              <span>DATABASE-DRIVEN</span>
              <strong>100%</strong>
              {/* <small>ดึงข้อมูลสด ไม่ใช้ Mockup Data</small> */}
            </div>
          </div>
        </section>

        {/* Main Body */}
        <div className="about-body-wrap">
          {/* Section 1: The Story */}
          <section className="about-section">
            <div className="about-section-heading">
              <p className="eyebrow">OUR ORIGIN STORY</p>
              <h2>จุดเริ่มต้นของ Family JS</h2>
            </div>
            <div className="about-prose">
              {profile.story.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}

              {profile.favorite_quote && (
                <blockquote className="about-quote">
                  &ldquo;{profile.favorite_quote}&rdquo;
                  {profile.quote_author && (
                    <footer className="mt-2 text-right text-xs uppercase tracking-widest text-[#a79ba8]">
                      — {profile.quote_author}
                    </footer>
                  )}
                </blockquote>
              )}
            </div>
          </section>

          {/* Section 2: TOP 10 Books Showcase */}
          <section className="about-section">
            <div className="about-section-heading">
              <p className="eyebrow flex items-center gap-1.5">
                <Award size={14} className="text-amber-400" /> CURATOR&apos;S
                ALL-TIME FAVORITES
              </p>
              <h2>TOP 10 หนังสือที่สุดในดวงใจ</h2>
              <p className="text-[#a79ba8] text-sm mt-1">
                จากหนังสือทั้งหมด {stats.totalBooks} เล่มในคลัง นี่คือ 10
                เล่มที่ฝังลึกในความทรงจำและอยากส่งต่อที่สุด
              </p>
            </div>

            {topBooks.length > 0 ? (
              <div className="about-top10-grid">
                {topBooks.map((item) => {
                  const rankClass =
                    item.rank === 1
                      ? "rank-1"
                      : item.rank === 2
                        ? "rank-2"
                        : item.rank === 3
                          ? "rank-3"
                          : `rank-${item.rank}`;

                  const book = item.book;

                  return (
                    <article
                      className={`about-top10-card ${rankClass}`}
                      key={item.rank}
                    >
                      <span className="top10-badge">
                        #{String(item.rank).padStart(2, "0")}
                      </span>

                      <div className="top10-cover-wrap">
                        {book?.cover_url ? (
                          <Image
                            src={book.cover_url}
                            alt={book.title}
                            fill
                            sizes="110px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="top10-cover-placeholder">
                            <Sparkles
                              size={20}
                              className="text-amber-400 mb-1"
                            />
                            <span className="text-[11px] leading-tight font-semibold line-clamp-2">
                              {book?.title || "เล่มที่เลือก"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="top10-content">
                        <div>
                          <h3>{book?.title || "หนังสือในดวงใจ"}</h3>
                          <p className="top10-author">
                            โดย {book?.author || "ไม่ระบุผู้แต่ง"}
                            {book?.page_count
                              ? ` · ${book.page_count} หน้า`
                              : ""}
                          </p>
                        </div>

                        {item.note ? (
                          <div className="top10-note">
                            &ldquo;{item.note}&rdquo;
                          </div>
                        ) : (
                          <div className="top10-note text-[#8e7f8f] italic">
                            หนึ่งในเล่มที่สร้างความประทับใจไม่รู้ลืม
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="about-top10-empty">
                <Award size={40} className="mx-auto text-amber-400/60 mb-3" />
                <h3 className="text-white font-medium text-lg mb-1">
                  กำลังจัดลำดับ 10 เล่มโปรดในดวงใจ
                </h3>
                <p className="text-sm max-w-md mx-auto mb-4">
                  ผู้ดูแลระบบสามารถเลือกหนังสือ 10 เล่มจากคลังหนังสือจริง
                  พร้อมเขียนเหตุผลความประทับใจได้ที่แผงควบคุม
                </p>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-[#3d2f40] hover:bg-[#523e57] text-white transition-colors"
                >
                  ไปที่แผงจัดการ (Admin) <ExternalLink size={14} />
                </Link>
              </div>
            )}
          </section>

          {/* Section 3: Reading Principles */}
          <section className="about-section">
            <div className="about-section-heading">
              <p className="eyebrow">READING PRINCIPLES</p>
              <h2>3 ความตั้งใจในการทำคลังหนังสือนี้</h2>
            </div>

            <div className="about-principles">
              <div className="about-principle-card">
                <span className="principle-icon">
                  <Compass className="w-7 h-7 text-amber-400" />
                </span>
                <h3>อ่านตามอารมณ์ ไม่ใช่ตามกระแส</h3>
                <p>
                  ไม่ต้องกดดันตัวเองว่าต้องอ่านเล่มที่ทุกคนพูดถึง
                  เราแบ่งหนังสือออกเป็น 5 โลก
                  เพื่อให้คุณเลือกเปิดตู้ตามความรู้สึกในวันนั้นจริง ๆ
                </p>
              </div>

              <div className="about-principle-card">
                <span className="principle-icon">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </span>
                <h3>เล่มที่ไม่ได้อ่าน ไม่ควรมีดาวปลอม</h3>
                <p>
                  คลังหนังสือของเรายึดความจริงใจ
                  เล่มไหนที่ยังอ่านไม่จบหรือยังไม่ได้อ่าน จะระบุชัดเจนว่า
                  &ldquo;ยังไม่ได้อ่าน&rdquo; โดยไม่มีการใส่คะแนนดาวเสแสร้ง
                </p>
              </div>

              <div className="about-principle-card">
                <span className="principle-icon">
                  <Coffee className="w-7 h-7 text-rose-400" />
                </span>
                <h3>เป็นเพื่อนชวนคุยเรื่องหนังสือ</h3>
                <p>
                  ทุกบทวิจารณ์และบันทึกไม่ได้เขียนในฐานะนักวิจารณ์มืออาชีพ
                  แต่เขียนเหมือนเพื่อนคนหนึ่งที่อ่านแล้วอิน
                  และอยากชวนคุณคุยว่าทำไมเล่มนี้น่าอ่าน
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: The 5 Reading Worlds */}
          <section className="about-section">
            <div className="about-section-heading">
              <p className="eyebrow">THE 5 BOOK CABINETS</p>
              <h2>5 โลกหนังสือในบ้านหลังนี้</h2>
            </div>
            <p className="about-prose">
              คลิกเลือกตู้ที่ตรงกับอารมณ์ของคุณในตอนนี้ หนังสือทั้งหมด{" "}
              {stats.totalBooks} เล่ม
              จะเปิดออกพร้อมแอนิเมชันพลิกหน้าและการจัดวางเฉพาะตัว:
            </p>

            <div className="about-genres-grid">
              {GENRE_LIST.map(({ id, symbol }) => {
                const config = GENRE_THEMES[id];
                const count = stats.byGenre[id] || 0;
                return (
                  <Link
                    href={`/genre/${id}`}
                    key={id}
                    className="about-genre-pill"
                    title={`เปิดตู้หมวด${config.name}`}
                  >
                    <span className="genre-sym">{symbol}</span>
                    <strong>{config.name}</strong>
                    <small>{config.englishName}</small>
                    <em>{count} เล่มบนชั้น</em>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Section 5: Connect */}
          <section className="about-section" style={{ borderBottom: "none" }}>
            <div className="about-connect-card">
              <div className="about-connect-info">
                <p className="eyebrow">CONNECT &amp; SAY HELLO</p>
                <h3>อยากชวนคุย หรือมีหนังสืออยากแนะนำ?</h3>
                <p>
                  ยินดีเสมอครับ
                  ส่งอีเมลมาพูดคุยแลกเปลี่ยนมุมมองหนังสือกับเราได้ที่{" "}
                  <strong className="text-white">
                    {profile.contact_email}
                  </strong>
                </p>
              </div>

              <div className="about-connect-actions">
                <Link href="/" className="about-btn-primary">
                  <Library size={18} /> เปิดตู้เลือกหนังสือ{" "}
                  <ArrowRight size={16} />
                </Link>
                <Link href="/blog" className="about-btn-secondary">
                  <BookOpen size={18} /> อ่านบล็อกทั่วไป
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bokk-footer">
        <span>
          FAMILY JS © <CurrentYear />
        </span>
        <Link href="/">หน้าแรก</Link>
        <Link href="/blog">บล็อกทั่วไป</Link>
        <Link href="/about">เกี่ยวกับเรา</Link>
        <span>STORIES · BOOKS · LIFE</span>
      </footer>
    </div>
  );
}
