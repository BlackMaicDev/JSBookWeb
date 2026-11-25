"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import type { GenreBook, GenreId, GenreThemeConfig } from "@/lib/genres-data";

type OpenBook = { book: GenreBook; genre: GenreThemeConfig; index: number; flightStyle: CSSProperties };
type BookPhase = "lifting" | "unfolding" | "open";
const DEFAULT_BOOKS_PER_SHELF = 12;

function useBooksPerShelf() {
  const [perShelf, setPerShelf] = useState(DEFAULT_BOOKS_PER_SHELF);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w <= 480) {
        setPerShelf(5);
      } else if (w <= 768) {
        setPerShelf(7);
      } else if (w <= 1024) {
        setPerShelf(9);
      } else {
        setPerShelf(12);
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perShelf;
}

const genrePalette: Record<GenreId, [string, string][]> = {
  crime: [["#a43f48", "#3e3040"], ["#6a5056", "#302b36"], ["#8e4650", "#222c38"], ["#5c4b59", "#332c35"]],
  classics: [["#b17c4e", "#665140"], ["#84664d", "#4f463e"], ["#b29365", "#655044"], ["#947a58", "#54443d"]],
  wuxia: [["#5d8b75", "#2e5c54"], ["#78967a", "#36574e"], ["#659081", "#2e5b58"], ["#729276", "#385a4c"]],
  romance: [["#d48a9a", "#976477"], ["#c9829c", "#8e6b88"], ["#dba49b", "#a26977"], ["#c78ca5", "#8e657d"]],
  manga: [["#e0b64f", "#aa6a48"], ["#54a9ad", "#40607c"], ["#c77d75", "#744d70"], ["#aaa2c5", "#656080"]],
};

const genreSymbols: Record<GenreId, string> = { crime: "✳", classics: "❦", wuxia: "山", romance: "♡", manga: "★" };

function bookColors(id: GenreId, index: number): CSSProperties {
  const [first, second] = genrePalette[id][index % genrePalette[id].length];
  return { "--shelf-color-a": first, "--shelf-color-b": second } as CSSProperties;
}

function CoverArtwork({ book, genre, index, large = false }: { book: GenreBook; genre: GenreId; index: number; large?: boolean }) {
  return <span className={`shelf-cover-art shelf-cover-${genre} ${large ? "shelf-cover-large" : ""}`} style={bookColors(genre, index)} aria-label={`${book.coverUrl ? "ภาพปก" : "ภาพปกจำลอง"} ${book.title}`} role="img">
    {book.coverUrl ? <Image src={book.coverUrl} alt="" fill sizes={large ? "205px" : "90px"} className="shelf-cover-photo" /> : <>
      <span className="shelf-cover-series">FAMILY JS · SELECTED STORY</span>
      <span className="shelf-cover-decoration" aria-hidden="true">{genreSymbols[genre]}</span>
      <span className="shelf-cover-title">{book.title}</span>
      <span className="shelf-cover-author">{book.author}</span>
    </>}
  </span>;
}

function BookSpread({ selected }: { selected: OpenBook }) {
  const { book, genre, index } = selected;
  const metrics = [book.metrics.m1, book.metrics.m2, book.metrics.m3, book.metrics.m4];
  return <div className={`book-spread book-spread-${genre.id}`}>
    <div className="book-spread-page book-spread-left">
      <span className="book-page-kicker">FAMILY JS / THE READING ROOM</span>
      <CoverArtwork book={book} genre={genre.id} index={index} large />
      <div className="book-spread-left-details"><span>{book.code}</span><h2 id="open-book-title">{book.title}</h2><p>{book.englishTitle}</p><strong>โดย {book.author}</strong></div>
      <span className="book-page-number">01</span>
    </div>
    <div className="book-spread-page book-spread-right">
      <div className="book-spread-topline"><span>{genre.name}</span><span>{book.rating != null ? `★ ${book.rating.toFixed(1)} / 5` : "ยังไม่ได้อ่าน"}</span></div>
      <p className="book-page-kicker">เรื่องราวในเล่ม</p>
      <h3>{book.title}</h3>
      <p className="book-spread-synopsis">{book.synopsis}</p>
      {book.highlightQuote && <blockquote>“{book.highlightQuote}”</blockquote>}
      {book.detailHtml && <section className="book-spread-rich"><h4>รีวิวฉบับเต็ม</h4><div className="rich-prose" dangerouslySetInnerHTML={{ __html: book.detailHtml }} /></section>}
      {metrics.some((value) => value > 0) && <div className="book-spread-metrics"><h4>มุมมองของเรา</h4>{genre.metricNames.map((name, metricIndex) => <div className="book-spread-metric" key={name}><span>{name}</span><div className="book-spread-meter"><span style={{ width: `${metrics[metricIndex] * 20}%` }} /></div><strong>{metrics[metricIndex]}/5</strong></div>)}</div>}
      <div className="book-spread-tags">{book.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="book-spread-footer"><span>{[book.pages ? `${book.pages} หน้า` : null, book.publisher].filter(Boolean).join(" · ")}</span><span className="book-page-number">02</span></div>
    </div>
  </div>;
}

export default function BookShelves({ genres, compact = false }: { genres: GenreThemeConfig[]; compact?: boolean }) {
  const perShelf = useBooksPerShelf();
  const [selected, setSelected] = useState<OpenBook | null>(null);
  const [phase, setPhase] = useState<BookPhase>("lifting");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selected || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    const unfoldTimer = window.setTimeout(() => setPhase("unfolding"), 720);
    const openTimer = window.setTimeout(() => {
      setPhase("open");
      closeRef.current?.focus();
    }, 1570);
    return () => {
      window.clearTimeout(unfoldTimer);
      window.clearTimeout(openTimer);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [selected]);

  function closeBook() {
    dialogRef.current?.close();
  }

  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeBook();
  }

  function openBook(book: GenreBook, genre: GenreThemeConfig, index: number, trigger: HTMLButtonElement) {
    const rect = trigger.getBoundingClientRect();
    const coverWidth = window.innerWidth <= 700 ? 155 : 210;
    const coverHeight = window.innerWidth <= 700 ? 230 : 310;
    const flightStyle = {
      "--flight-x": `${rect.left + rect.width / 2 - window.innerWidth / 2}px`,
      "--flight-y": `${rect.top + rect.height / 2 - window.innerHeight / 2}px`,
      "--flight-scale-x": rect.width / coverWidth,
      "--flight-scale-y": rect.height / coverHeight,
      ...bookColors(genre.id, index),
    } as CSSProperties;
    triggerRef.current = trigger;
    setPhase("lifting");
    setSelected({ book, genre, index, flightStyle });
  }

  return <div className={`family-bookshelves ${compact ? "family-bookshelves-compact" : ""}`}>
    {genres.map((genre) => {
      const books = [genre.spotlightBook, ...genre.books];
      const shelves = Array.from(
        { length: Math.ceil(books.length / perShelf) },
        (_, shelfIndex) => books.slice(shelfIndex * perShelf, (shelfIndex + 1) * perShelf),
      );
      return <div className={`bookshelf-row bookshelf-${genre.id}`} key={genre.id}>
        <div className="bookshelf-row-heading"><div><span className="bookshelf-eyebrow">{genre.englishName}</span><h3>{genre.name}</h3></div>{!compact && <Link href={`/genre/${genre.id}`}>ดูหมวดนี้</Link>}</div>
        <div className="bookshelf-scenes">{shelves.map((shelf, shelfIndex) =>
          <div className="bookshelf-scene" role="group" aria-label={`${genre.name} ชั้นที่ ${shelfIndex + 1}`} key={shelfIndex}>
            {shelves.length > 1 && <span className="bookshelf-level-label">ชั้นที่ {shelfIndex + 1}</span>}
            <div className="bookshelf-books">{shelf.map((book, bookIndex) => {
              const index = shelfIndex * perShelf + bookIndex;
              return <button key={book.id} type="button" className={`bookshelf-book bookshelf-book-${(bookIndex % 6) + 1}${selected?.book.id === book.id && selected.genre.id === genre.id ? " is-being-opened" : ""}`} style={bookColors(genre.id, index)} aria-label={`เปิดหนังสือ ${book.title}`} onClick={(event) => openBook(book, genre, index, event.currentTarget)}><span className="bookshelf-spine-top" aria-hidden="true">FJ</span><span className="bookshelf-spine-title">{book.title}</span><span className="bookshelf-spine-foot" aria-hidden="true">{genreSymbols[genre.id]}</span><span className="bookshelf-hover-card" aria-hidden="true"><CoverArtwork book={book} genre={genre.id} index={index} /><span className="bookshelf-hover-copy"><strong>{book.title}</strong><small>{book.author}{book.rating != null ? ` · ★ ${book.rating.toFixed(1)}` : " · ยังไม่ได้อ่าน"}</small></span></span></button>;
            })}</div><div className="bookshelf-wood" aria-hidden="true" />
          </div>,
        )}</div>
      </div>;
    })}

    <dialog ref={dialogRef} className={`book-dialog book-dialog-${phase}`} aria-label={selected && phase === "lifting" ? `กำลังเปิดหนังสือ ${selected.book.title}` : undefined} aria-labelledby={selected && phase !== "lifting" ? "open-book-title" : undefined} onClick={handleBackdrop} onClose={() => { setSelected(null); triggerRef.current?.focus(); }}>
      {selected && <>
        {phase !== "open" && <div className="book-flight" style={selected.flightStyle} aria-hidden="true"><span className="book-flight-spine"><span>{selected.book.title}</span></span><CoverArtwork book={selected.book} genre={selected.genre.id} index={selected.index} large /></div>}
        <div className="book-dialog-content"><div className="book-dialog-toolbar"><span>เปิดอ่านหนังสือ</span><button ref={closeRef} type="button" onClick={closeBook} aria-label="ปิดหนังสือ"><X size={20} /><span>ปิด</span></button></div><BookSpread selected={selected} /></div>
      </>}
    </dialog>
  </div>;
}
