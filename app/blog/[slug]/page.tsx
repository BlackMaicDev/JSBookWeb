import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlogArticle } from "@/components/BlogContent";
import { contentRepository } from "@/lib/content/repository";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await contentRepository.getBlogPost(slug);
  return { title: `${post?.title ?? "ไม่พบบทความ"} | Family JS`, description: post?.excerpt };
}

export default function BlogPostPage({ params }: Props) {
  return <Suspense fallback={<main className="blog-article-loading">กำลังเปิดบทความ...</main>}><BlogPostContent params={params} /></Suspense>;
}

async function BlogPostContent({ params }: Props) {
  const { slug } = await params;
  const post = await contentRepository.getBlogPost(slug);
  if (!post) notFound();
  return <BlogArticle post={post} />;
}
