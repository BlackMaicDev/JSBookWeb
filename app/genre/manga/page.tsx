import type { Metadata } from "next";
import { GenreEmpty, GenreExperience } from "@/components/EditorialSite";
import { GENRE_THEMES } from "@/lib/genres-data";
import { contentRepository } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "มังงะ | Family JS",
  description: GENRE_THEMES.manga.tagline,
};

export default async function MangaPage() {
  const genre = await contentRepository.getGenre("manga");
  return genre ? <GenreExperience genre={genre} /> : <GenreEmpty id="manga" />;
}
