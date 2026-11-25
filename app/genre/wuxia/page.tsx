import type { Metadata } from "next";
import { GenreEmpty, GenreExperience } from "@/components/EditorialSite";
import { GENRE_THEMES } from "@/lib/genres-data";
import { contentRepository } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "กำลังภายใน | Family JS",
  description: GENRE_THEMES.wuxia.tagline,
};

export default async function WuxiaPage() {
  const genre = await contentRepository.getGenre("wuxia");
  return genre ? <GenreExperience genre={genre} /> : <GenreEmpty id="wuxia" />;
}
