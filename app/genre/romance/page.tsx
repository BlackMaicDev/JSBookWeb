import type { Metadata } from "next";
import { GenreEmpty, GenreExperience } from "@/components/EditorialSite";
import { GENRE_THEMES } from "@/lib/genres-data";
import { contentRepository } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "โรแมนซ์ | Family JS",
  description: GENRE_THEMES.romance.tagline,
};

export default async function RomancePage() {
  const genre = await contentRepository.getGenre("romance");
  return genre ? <GenreExperience genre={genre} /> : <GenreEmpty id="romance" />;
}
