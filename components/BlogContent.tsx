import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog-data";
import { contentRepository } from "@/lib/content/repository";
import { GenreNav } from "@/components/EditorialSite";
import MotionEffects from "@/components/MotionEffects";
import CurrentYear from "@/components/CurrentYear";

export function BlogArt({ art, coverUrl, title, large = false }: { art: BlogPost["art"]; coverUrl?: string; title?: string; large?: boolean }) {
  const symbols = { morning: "☀", home: "⌂", notes: "✎", weekend: "♡" };
  if (coverUrl) return <div className={`blog-art blog-art-has-image ${large ? "blog-art-large" : ""}`}><Image src={coverUrl} alt={`รูปปกบทความ ${title || ""}`} fill sizes={large ? "(max-width: 850px) 100vw, 50vw" : "(max-width: 850px) 100vw, 33vw"} className="blog-art-photo" /></div>;
  return <div className={`blog-art blog-art-${art} ${large ? "blog-art-large" : ""}`} aria-hidden="true"><span className="blog-art-orbit"/><span className="blog-art-symbol">{symbols[art]}</span><span className="blog-art-sun"/></div>;
}

export function BlogCard({ post }: { post: BlogPost }) {
  return <article className="blog-card"><Link href={`/blog/${post.slug}`} aria-label={`อ่านบทความ ${post.title}`} className="blog-card-art-link"><BlogArt art={post.art} coverUrl={post.coverUrl} title={post.title} /></Link><div className="blog-card-content"><p className="blog-meta"><span>{post.category}</span><span>{post.readingTime}</span></p><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><Link className="blog-read-link" href={`/blog/${post.slug}`}>อ่านบทความ</Link></div></article>;
}

export async function BlogArticle({ post }: { post: BlogPost }) {
  const related = (await contentRepository.getBlogPosts()).filter((item) => item.slug !== post.slug).slice(0, 2);
  return <div className="bokk family-blog blog-article-page"><MotionEffects /><GenreNav active="blog" /><main><section className="blog-article-header"><div className="blog-article-heading"><Link href="/blog" className="blog-breadcrumb">บล็อกทั่วไป</Link><span className="blog-article-category">{post.category} · {post.readingTime}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="blog-author-line"><span className="blog-author-avatar">FJ</span><span><strong>Family JS</strong><small>เรื่องเล่าจากบ้านของเรา</small></span></div></div><BlogArt art={post.art} coverUrl={post.coverUrl} title={post.title} large /></section><section className="blog-reading-layout"><article className="blog-prose"><p className="blog-prose-lead">{post.excerpt}</p>{post.sections.map((section, index) => section.html ? <div key={index} className="rich-prose" dangerouslySetInnerHTML={{ __html: section.html }} /> : <div key={index}>{section.heading && <h2>{section.heading}</h2>}{(section.paragraphs || []).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>)}<blockquote>“{post.quote}”</blockquote><div className="blog-endnote"><span>จบบันทึกฉบับนี้</span><Link href="/blog">กลับไปอ่านเรื่องอื่น</Link></div></article><aside className="blog-article-aside"><div><span>FAMILY JS JOURNAL</span><p>เรื่องเล่าธรรมดา ๆ ที่อยากเก็บไว้ให้อ่านอีกครั้ง</p></div><div><span>กำลังอ่าน</span><strong>{post.title}</strong><small>{post.readingTime}</small></div></aside></section><section className="blog-related"><div className="blog-related-head"><p className="eyebrow">KEEP READING</p><h2>เรื่องที่คุณอาจชอบ</h2></div><div className="blog-related-grid">{related.map((item) => <BlogCard post={item} key={item.slug} />)}</div></section></main><footer className="bokk-footer"><span>FAMILY JS © <CurrentYear /></span><Link href="/">หน้าแรก</Link><span>STORIES · BOOKS · LIFE</span></footer></div>;
}
