"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { GenreId } from "@/lib/genres-data";
import FamilyLogo from "@/components/FamilyLogo";
import { createClient } from "@/lib/supabase/client";

type ActivePage = GenreId | "blog" | "about";

const genres: { id: GenreId; label: string; english: string }[] = [
  { id: "crime", label: "สืบสวน", english: "Crime & Thriller" },
  { id: "classics", label: "คลาสสิก", english: "Classic Literature" },
  { id: "wuxia", label: "กำลังภายใน", english: "Wuxia & Xianxia" },
  { id: "romance", label: "โรแมนซ์", english: "Romance & Feel-Good" },
  { id: "manga", label: "มังงะ", english: "Manga & Graphic Novels" },
];

export default function FamilyNav({ active }: { active?: ActivePage }) {
  const [genresOpen, setGenresOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check auth session
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setIsLoggedIn(true);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(Boolean(session?.user));
      });
      return () => subscription.unsubscribe();
    } catch {}
  }, []);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setGenresOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setGenresOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function closeMenus() {
    setGenresOpen(false);
    setMobileOpen(false);
  }

  return <header className="family-nav-shell">
    <div className="family-nav">
      <Link href="/" className="family-brand" aria-label="Family JS หน้าแรก" onClick={closeMenus}>
        <FamilyLogo />
      </Link>
      <nav className="family-nav-desktop" aria-label="เมนูหลัก">
        <Link href="/" className={!active ? "active" : ""} aria-current={!active ? "page" : undefined}>หน้าแรก</Link>
        <div className="family-nav-popover-wrap" ref={popoverRef}>
          <button type="button" aria-expanded={genresOpen} aria-controls="family-genre-menu" className={active && active !== "blog" ? "active" : ""} onClick={() => setGenresOpen((open) => !open)}>รีวิวหนังสือ <span>05</span></button>
          {genresOpen && <div id="family-genre-menu" className="family-genre-popover">
            <div className="family-popover-heading"><strong>เลือกโลกของหนังสือ</strong><span>5 หมวด · 5 บรรยากาศ</span></div>
            <div className="family-popover-grid">{genres.map((genre, index) => <Link key={genre.id} href={`/genre/${genre.id}`} onClick={closeMenus} className={`family-popover-item popover-${genre.id}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{genre.label}</strong><small>{genre.english}</small></div></Link>)}</div>
          </div>}
        </div>
        <Link href="/blog" className={active === "blog" ? "active" : ""} aria-current={active === "blog" ? "page" : undefined}>บล็อกทั่วไป</Link>
        <Link href="/about" className={active === "about" ? "active" : ""} aria-current={active === "about" ? "page" : undefined}>เกี่ยวกับเรา</Link>
      </nav>
      <div className="family-nav-actions"><Link href={isLoggedIn ? "/admin" : "/login"} className="family-nav-login">{isLoggedIn ? "แผงจัดการ" : "พื้นที่เขียน"}</Link><button className="family-menu-toggle" type="button" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={mobileOpen} aria-controls="family-mobile-menu" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    </div>
    {mobileOpen && <nav id="family-mobile-menu" className="family-mobile-menu" aria-label="เมนูมือถือ"><Link href="/" onClick={closeMenus}>หน้าแรก</Link><Link href="/blog" onClick={closeMenus}>บล็อกทั่วไป</Link><Link href="/about" onClick={closeMenus}>เกี่ยวกับเรา</Link><p>รีวิวหนังสือ</p>{genres.map((genre) => <Link href={`/genre/${genre.id}`} key={genre.id} onClick={closeMenus}>{genre.label}</Link>)}<Link href={isLoggedIn ? "/admin" : "/login"} onClick={closeMenus}>{isLoggedIn ? "แผงจัดการ" : "พื้นที่เขียน"}</Link></nav>}
  </header>;
}
