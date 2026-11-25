import Link from "next/link";
import Image from "next/image";
import { GENRE_THEMES } from "@/lib/genres-data";
import { GenreNav, genreOrder } from "@/components/EditorialSite";
import GenreCabinets from "@/components/GenreCabinets";
import MotionEffects from "@/components/MotionEffects";
import { contentRepository } from "@/lib/content/repository";
import { BlogArt } from "@/components/BlogContent";
import CurrentYear from "@/components/CurrentYear";
import { Award } from "lucide-react";
import HomeAmbient from "@/components/HomeAmbient";

export default async function HomePage() {
  const [blogPosts, profile] = await Promise.all([
    contentRepository.getBlogPosts(),
    contentRepository.getAboutProfile(),
  ]);
  const topBooks = profile.top_books || [];
  return (
    <div className="bokk bokk-home">
      <HomeAmbient />
      <MotionEffects />
      <GenreNav />
      <main>
        <section className="home-hero">
          <div className="home-hero-inner">
            <p className="eyebrow">FAMILY JS · STORIES, BOOKS & LIFE</p>
            <h1>ทุกวันมีเรื่องเล่า<br /><em>ให้กลับมาอ่าน</em></h1>
            <p className="home-intro">บ้านเล็ก ๆ ของเรื่องราวดี ๆ จากหนังสือเล่มโปรดไปจนถึงบันทึกชีวิตประจำวัน เลือกอ่านตามอารมณ์ แล้วอยู่ด้วยกันอีกสักพัก</p>
            <div className="home-hero-rule"><span>EXPLORE THE STORIES</span><span>BOOK REVIEWS + EVERYDAY BLOG</span></div>
          </div>
          <div className="home-hero-art family-home-art" aria-hidden="true"><Image src="/family-js-mark.svg" alt="" width={92} height={92} className="family-home-logo-mark" /><span>FAMILY</span><strong>JS.</strong><small>STORIES LIVE HERE</small></div>
        </section>

        {/* ── TOP 10 SHOWCASE ── */}
        {topBooks.length > 0 && (
          <section className="home-top10" aria-labelledby="home-top10-title">
            <div className="home-top10-ambient-spotlight" aria-hidden="true" />
            <div className="home-top10-header">
              <div>
                <p className="eyebrow"><Award size={14} className="inline -mt-0.5 mr-1 text-amber-500" />ALL-TIME FAVORITES</p>
                <h2 id="home-top10-title">หนังสือที่สุดในดวงใจ</h2>
                <p className="home-top10-sub">จากคลังหนังสือทั้งหมด เราคัดสรร {topBooks.length} เล่มที่ประทับใจที่สุด พร้อมเหตุผลจากใจจริง</p>
              </div>
              <Link href="/about" className="home-top10-more">ดูรายละเอียดทั้งหมด</Link>
            </div>

            {/* Top 3 Podium — medal ceremony style: #2 | #1 | #3 */}
            <div className="top10-podium">
              {[2, 1, 3].map((targetRank) => {
                const item = topBooks.find((b) => b.rank === targetRank);
                if (!item) return null;
                const book = item.book;
                const medal = item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉";
                return (
                  <div className={`podium-slot podium-slot-${item.rank}`} key={item.rank}>
                    {/* Person on the podium (cover + info) */}
                    <div className="podium-person">
                      <div className="podium-cover">
                        {book?.cover_url ? (
                          <Image src={book.cover_url} alt={book.title} fill sizes="(max-width: 700px) 120px, 170px" className="object-cover" />
                        ) : (
                          <div className="podium-cover-fallback">
                            <Award size={24} className="text-amber-400" />
                          </div>
                        )}
                        <span className="podium-medal">{medal}</span>
                      </div>
                      <div className="podium-info">
                        <h3>{book?.title || "หนังสือในดวงใจ"}</h3>
                        <p className="podium-author">โดย {book?.author || "—"}</p>
                        {item.note && <p className="podium-note">&ldquo;{item.note}&rdquo;</p>}
                      </div>
                    </div>
                    {/* The pedestal block */}
                    <div className="podium-pedestal">
                      <span className="pedestal-rank">{item.rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remaining books (rank 4+) */}
            {topBooks.length > 3 && (
              <div className="top10-rest-grid">
                {topBooks.slice(3).map((item) => {
                  const book = item.book;
                  return (
                    <article className="top10-rest-card" key={item.rank}>
                      <span className="top10-rest-rank">#{String(item.rank).padStart(2, "0")}</span>
                      <div className="top10-rest-cover">
                        {book?.cover_url ? (
                          <Image src={book.cover_url} alt={book.title} fill sizes="68px" className="object-cover" />
                        ) : (
                          <div className="podium-cover-fallback" style={{ fontSize: "0.65rem" }}>
                            <Award size={16} className="text-amber-400/60" />
                          </div>
                        )}
                      </div>
                      <div className="top10-rest-info">
                        <h4>{book?.title || "หนังสือในดวงใจ"}</h4>
                        <span>โดย {book?.author || "—"}{item.note ? ` · "${item.note}"` : ""}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="home-directory" aria-labelledby="directory-title">
          <div className="home-section-heading"><p className="eyebrow">THE FAMILY JS LIBRARY</p><h2 id="directory-title">เปิดตู้ เลือกโลกที่อยากอ่าน</h2><p className="cabinet-instruction">เลือกตู้ที่ชอบ เมื่อบานประตูเปิดแล้ว เราจะพาไปพบหนังสือในหมวดนั้น</p></div>
          <GenreCabinets genres={genreOrder.map((id) => GENRE_THEMES[id])} />
        </section>
        {blogPosts.length > 0 && (
        <section className="home-blog-section" aria-labelledby="home-blog-title"><div className="home-blog-heading"><div><p className="eyebrow">BEYOND THE BOOKS</p><h2 id="home-blog-title">เรื่องเล่าจากวันธรรมดา</h2><p>อ่านบันทึกเกี่ยวกับบ้าน ชีวิต ไอเดีย และคนที่เราอยากใช้เวลาด้วย</p></div><Link href="/blog">ดูบล็อกทั้งหมด</Link></div><div className="home-blog-grid">{blogPosts.slice(0, 2).map((post) => <Link className="home-blog-card" href={`/blog/${post.slug}`} key={post.slug}><BlogArt art={post.art} coverUrl={post.coverUrl} title={post.title} /><div><span>{post.category} · {post.readingTime}</span><h3>{post.title}</h3><p>{post.excerpt}</p><strong>อ่านบทความ</strong></div></Link>)}</div></section>
        )}
      </main>
      <footer className="bokk-footer"><span>FAMILY JS © <CurrentYear /></span><Link href="/blog">บล็อกทั่วไป</Link><Link href="/about">เกี่ยวกับเรา</Link><span>STORIES · BOOKS · LIFE</span></footer>
    </div>
  );
}
