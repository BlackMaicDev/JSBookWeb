export type GenreId = "crime" | "classics" | "wuxia" | "romance" | "manga";

export interface GenreBook {
  id: string;
  code: string;
  title: string;
  englishTitle: string;
  author: string;
  translator?: string;
  publisher?: string;
  pages: number | null;
  rating: number | null;
  stamp: {
    text: string;
    variant: "crimson" | "amber" | "cyan" | "emerald" | "purple";
  };
  coverGradient: string;
  coverUrl?: string;
  synopsis: string;
  detailHtml?: string;
  highlightQuote: string;
  tags: string[];
  metrics: {
    m1: number;
    m2: number;
    m3: number;
    m4: number;
  };
}

export interface GenreThemeConfig {
  id: GenreId;
  name: string;
  englishName: string;
  brandName: string;
  tagline: string;
  iconName: string;
  cssClass: string;
  accentColor: string;
  metricNames: [string, string, string, string];
  metricIcons: [string, string, string, string];
  subGenres: { name: string; english: string; count: number }[];
  spotlightBook: GenreBook;
  books: GenreBook[];
}

export type GenreThemeBase = Omit<GenreThemeConfig, "subGenres" | "spotlightBook" | "books">;

export const GENRE_THEMES: Record<GenreId, GenreThemeBase> = {
  crime: {
    id: "crime",
    name: "สืบสวน & ระทึกขวัญ",
    englishName: "Crime & Thriller",
    brandName: "THE COLD DOSSIER",
    tagline: "หอจดหมายเหตุคดีฆาตกรรมลับ & แฟ้มจิตวิทยาชันสูตร (EST. 1995)",
    iconName: "Skull",
    cssClass: "theme-crime",
    accentColor: "text-red-500 border-red-600 bg-red-950/40",
    metricNames: ["หักมุม / ปั่นประสาท", "บรรยากาศกดดัน", "ความดิบโหด / เลือดสาด", "จังหวะลุ้นระทึก"],
    metricIcons: ["Brain", "CloudFog", "Droplets", "Zap"],
  },
  classics: {
    id: "classics",
    name: "วรรณกรรมคลาสสิก",
    englishName: "Classic Literature",
    brandName: "BIBLIOTHECA ANTIQUA",
    tagline: "หอสมุดวรรณกรรมอมตะ ท่องโลกแห่งปรัชญาและถ้อยคำข้ามกาลเวลา",
    iconName: "BookOpen",
    cssClass: "theme-classics",
    accentColor: "text-amber-400 border-amber-600 bg-amber-950/40",
    metricNames: ["ความลุ่มลึกเชิงปรัชญา", "ความงดงามทางวรรณศิลป์", "พลังสะท้อนสังคม", "ความตราตรึงใจ"],
    metricIcons: ["Sparkles", "Feather", "Compass", "Bookmark"],
  },
  wuxia: {
    id: "wuxia",
    name: "นิยายจีนกำลังภายใน",
    englishName: "Wuxia & Xianxia",
    brandName: "THE WANDERING JIANGHU",
    tagline: "หอคัมภีร์ยุทธภพ สดับเสียงกระบี่ วิถีจอมยุทธ์ และชะตากรรมใต้หล้า",
    iconName: "Sword",
    cssClass: "theme-wuxia",
    accentColor: "text-emerald-400 border-emerald-600 bg-emerald-950/40",
    metricNames: ["ความมันส์วิทยายุทธ์", "ปรัชญาเต๋า & ชะตากรรม", "การชิงไหวพริบราชสำนัก", "ความลึกซึ้งของมิตรภาพ"],
    metricIcons: ["Flame", "ShieldAlert", "Brain", "Users"],
  },
  romance: {
    id: "romance",
    name: "นิยายรัก & อบอุ่นหัวใจ",
    englishName: "Romance & Feel-Good",
    brandName: "VELVET & SUNSET",
    tagline: "บันทึกหัวใจและไออุ่น เรื่องราวความรัก ละมุนใจ และการเยียวยาบาดแผล",
    iconName: "Heart",
    cssClass: "theme-romance",
    accentColor: "text-rose-400 border-rose-600 bg-rose-950/40",
    metricNames: ["ดัชนีความหวาน (Sweetness)", "ความอบอุ่นฮีลใจ", "ระดับความหน่วงตับพัง", "เคมีระหว่างตัวละคร"],
    metricIcons: ["Heart", "Sun", "CloudRain", "Sparkles"],
  },
  manga: {
    id: "manga",
    name: "มังงะ & คอมิกส์",
    englishName: "Manga & Graphic Novels",
    brandName: "PANEL & HALFTONE",
    tagline: "โลกแห่งหมึกพิมพ์สกรีนโทน ลายเส้นคมกริบ และจินตนาการไร้ขีดจำกัด",
    iconName: "Sparkles",
    cssClass: "theme-manga",
    accentColor: "text-cyan-400 border-cyan-500 bg-cyan-950/40",
    metricNames: ["ความทรงพลังของลายเส้น", "ความตื่นเต้นของพล็อต", "การออกแบบตัวละคร", "ระดับความไฮป์ 🔥"],
    metricIcons: ["Eye", "Flame", "Users", "Zap"],
  },
};
