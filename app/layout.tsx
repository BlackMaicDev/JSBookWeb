import type { Metadata } from "next";
import { Cinzel, Space_Mono, Prompt, Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";
import "./editorial.css";
import "./editorial-modern.css";
import "./workspace.css";
import "./family.css";
import "./bookshelf.css";
import "./cabinet.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
});

const notoSansThai = Noto_Sans_Thai({
  weight: "variable",
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

const notoSerifThai = Noto_Serif_Thai({
  weight: "variable",
  variable: "--font-noto-serif-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Family JS | เรื่องเล่า หนังสือ และชีวิตประจำวัน",
  description: "Family JS รวมบล็อกทั่วไปและรีวิวหนังสือ 5 หมวดในบรรยากาศที่ต่างกัน",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${cinzel.variable} ${spaceMono.variable} ${prompt.variable} ${notoSansThai.variable} ${notoSerifThai.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050508] text-slate-200 selection:bg-red-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
