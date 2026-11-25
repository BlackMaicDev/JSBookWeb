import type { Metadata } from "next";
import { GenreEmpty, GenreExperience } from "@/components/EditorialSite";
import { GENRE_THEMES } from "@/lib/genres-data";
import { contentRepository } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "สืบสวน & ระทึกขวัญ | Family JS",
  description: GENRE_THEMES.crime.tagline,
};

export default async function CrimePage() {
  const genre = await contentRepository.getGenre("crime");
  return genre ? <GenreExperience genre={genre} /> : <GenreEmpty id="crime" />;
}
