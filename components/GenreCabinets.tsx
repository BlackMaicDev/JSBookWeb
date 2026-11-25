"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { GenreId, GenreThemeBase } from "@/lib/genres-data";

const symbols: Record<GenreId, string> = {
  crime: "✳",
  classics: "❦",
  wuxia: "山",
  romance: "♡",
  manga: "★",
};

const cabinetLabels: Record<GenreId, string> = {
  crime: "THE CASE ROOM",
  classics: "THE OLD LIBRARY",
  wuxia: "THE HIDDEN SCROLL",
  romance: "THE LOVE LETTER",
  manga: "THE NEXT PANEL",
};

type CabinetPhase = "moving" | "opening" | "leaving";
type ActiveCabinet = { genre: GenreThemeBase; index: number; flightStyle: CSSProperties };

function CabinetVisual({ genre, index }: { genre: GenreThemeBase; index: number }) {
  return <>
    <span className="cabinet-crown" aria-hidden="true"><span>FAMILY JS</span><span>{String(index + 1).padStart(2, "0")}</span></span>
    <span className="cabinet-frame" aria-hidden="true">
      <span className="cabinet-inside"><span className="cabinet-inside-halo" /><span className="cabinet-inside-symbol">{symbols[genre.id]}</span><span className="cabinet-inside-label">{cabinetLabels[genre.id]}</span></span>
      <span className="cabinet-door cabinet-door-left"><span className="cabinet-door-inset" /><span className="cabinet-door-emblem">{symbols[genre.id]}</span><span className="cabinet-door-handle" /></span>
      <span className="cabinet-door cabinet-door-right"><span className="cabinet-door-inset" /><span className="cabinet-door-handle" /></span>
    </span>
    <span className="cabinet-base" aria-hidden="true" />
  </>;
}

export default function GenreCabinets({ genres }: { genres: GenreThemeBase[] }) {
  const pathname = usePathname();
  return <CabinetDirectory key={pathname} genres={genres} showOverlay={pathname === "/"} />;
}

function CabinetDirectory({ genres, showOverlay }: { genres: GenreThemeBase[]; showOverlay: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState<ActiveCabinet | null>(null);
  const [phase, setPhase] = useState<CabinetPhase>("moving");
  const timers = useRef<number[]>([]);
  const sourceRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
      setActive(null);
      sourceRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  function handleCabinetClick(event: MouseEvent<HTMLAnchorElement>, genre: GenreThemeBase, index: number) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (active) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const source = event.currentTarget;
    const crown = source.querySelector(".cabinet-crown");
    const base = source.querySelector(".cabinet-base");
    if (!crown || !base) {
      router.push(`/genre/${genre.id}`);
      return;
    }
    const crownRect = crown.getBoundingClientRect();
    const baseRect = base.getBoundingClientRect();
    const endWidth = Math.min(320, window.innerWidth - 48);
    const flightStyle = {
      "--cabinet-flight-x": `${crownRect.left + crownRect.width / 2 - window.innerWidth / 2}px`,
      "--cabinet-flight-y": `${(crownRect.top + baseRect.bottom) / 2 - window.innerHeight / 2}px`,
      "--cabinet-flight-scale-x": crownRect.width / endWidth,
      "--cabinet-flight-scale-y": (baseRect.bottom - crownRect.top) / 393,
    } as CSSProperties;
    sourceRef.current = source;
    setPhase("moving");
    setActive({ genre, index, flightStyle });
    timers.current = [
      window.setTimeout(() => setPhase("opening"), 640),
      window.setTimeout(() => setPhase("leaving"), 1500),
      window.setTimeout(() => router.push(`/genre/${genre.id}`), 2060),
    ];
  }

  return <><div className="cabinet-directory" aria-busy={active !== null}>
    {genres.map((genre, index) => <Link
      key={genre.id}
      href={`/genre/${genre.id}`}
      className={`genre-cabinet cabinet-${genre.id}${active?.genre.id === genre.id ? " is-source-opening" : ""}${active && active.genre.id !== genre.id ? " is-waiting" : ""}`}
      onClick={(event) => handleCabinetClick(event, genre, index)}
      aria-label={`เปิดตู้หมวด${genre.name}`}
    >
      <CabinetVisual genre={genre} index={index} />
      <span className="cabinet-caption"><strong>{genre.name}</strong><small>{genre.englishName}</small><span>แตะเพื่อเปิดตู้ <span aria-hidden="true">↗</span></span></span>
    </Link>)}
  </div>
  {active && showOverlay && createPortal(<div className={`cabinet-journey cabinet-journey-${phase} cabinet-${active.genre.id}`} aria-hidden="true">
    <div className={`cabinet-flight cabinet-${active.genre.id}`} style={active.flightStyle}><CabinetVisual genre={active.genre} index={active.index} /></div>
    <div className="cabinet-page-wipe" />
  </div>, document.body)}
  </>;
}
