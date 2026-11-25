import type { Metadata } from "next";
import { GenreEmpty, GenreExperience } from "@/components/EditorialSite";
import { GENRE_THEMES } from "@/lib/genres-data";
import { contentRepository } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "วรรณกรรมคลาสสิก | Family JS",
  description: GENRE_THEMES.classics.tagline,
};

export default async function ClassicsPage() {
  const genre = await contentRepository.getGenre("classics");
  return genre ? <GenreExperience genre={genre} /> : <GenreEmpty id="classics" />;
}
