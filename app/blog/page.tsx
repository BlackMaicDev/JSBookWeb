import type { Metadata } from "next";
import Link from "next/link";
import { contentRepository } from "@/lib/content/repository";
import { BlogArt, BlogCard } from "@/components/BlogContent";
import { GenreNav } from "@/components/EditorialSite";
import MotionEffects from "@/components/MotionEffects";
import CurrentYear from "@/components/CurrentYear";

export const metadata: Metadata = {
  title: "บล็อกทั่วไป | Family JS",
  description: "เรื่องเล่าชีวิตประจำวัน บ้าน ไอเดีย บันทึก และครอบครัวจาก Family JS",
};

export default async function BlogPage() {
  const [featured, ...more] = await contentRepository.getBlogPosts();
  if (!featured) {
    return <div className="bokk family-blog"><MotionEffects /><GenreNav active="blog" /><main className="genre-empty"><div className="genre-empty-content"><p className="eyebrow">FAMILY JS JOURNAL</p><h1>บล็อกทั่วไป</h1><p>ยังไม่มีบทความที่เผยแพร่</p><Link href="/">กลับหน้าแรก</Link></div></main><footer className="bokk-footer"><span>FAMILY JS © <CurrentYear /></span><Link href="/">หน้าแรก</Link><span>STORIES · BOOKS · LIFE</span></footer></div>;
  }
  return <div className="bokk family-blog"><MotionEffects /><GenreNav active="blog" /><main><section className="blog-index-hero"><div><p className="eyebrow">FAMILY JS JOURNAL</p><h1>เรื่องเล่าจาก<br /><em>วันธรรมดา</em></h1><p>พื้นที่สำหรับบันทึกสิ่งเล็ก ๆ รอบตัว ทั้งบ้าน ครอบครัว ไอเดีย และวันที่อยากใช้ชีวิตให้ช้าลง</p><div className="blog-hero-tags"><span>ชีวิตประจำวัน</span><span>บ้านและไอเดีย</span><span>บันทึก</span><span>ครอบครัว</span></div></div><div className="blog-hero-decoration" aria-hidden="true"><span>FAMILY</span><strong>JS.</strong></div></section><section className="blog-featured"><div className="blog-section-title"><p className="eyebrow">EDITOR&apos;S LETTER</p><h2>บทความชวนอ่าน</h2></div><Link href={`/blog/${featured.slug}`} className="blog-feature-link"><BlogArt art={featured.art} coverUrl={featured.coverUrl} title={featured.title} large /><div><span className="blog-feature-issue">{featured.issue} · {featured.readingTime}</span><p className="blog-feature-category">{featured.category}</p><h3>{featured.title}</h3><p>{featured.excerpt}</p><strong>เปิดอ่านเรื่องนี้</strong></div></Link></section><section className="blog-all"><div className="blog-section-title"><p className="eyebrow">MORE FROM THE JOURNAL</p><h2>เรื่องล่าสุดจากเรา</h2></div><div className="blog-card-grid">{more.map((post) => <BlogCard post={post} key={post.slug} />)}</div></section></main><footer className="bokk-footer"><span>FAMILY JS © <CurrentYear /></span><Link href="/">กลับหน้าแรก</Link><span>STORIES · BOOKS · LIFE</span></footer></div>;
}
