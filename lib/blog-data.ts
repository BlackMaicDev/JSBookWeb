export interface BlogPost {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readingTime: string;
  issue: string;
  art: "morning" | "home" | "notes" | "weekend";
  coverUrl?: string;
  quote: string;
  sections: { heading?: string; paragraphs?: string[]; html?: string }[];
}

