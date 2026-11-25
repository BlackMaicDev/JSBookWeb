"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  speedY: number;
  speedX: number;
  sinOffset: number;
  sinSpeed: number;
  color: string;
}

/* ── SVG ICONS FOR FLOATING LITERARY MOTIFS ── */
function ButterflySvg() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="butterfly-wings"
      width="100%"
      height="100%"
    >
      {/* Left wings */}
      <path
        d="M24 24 C16 11, 4 15, 6 25 C8 32, 16 32, 24 27"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <path
        d="M24 27 C18 30, 8 38, 12 42 C16 45, 22 38, 24 30"
        fill="currentColor"
        fillOpacity="0.22"
      />
      {/* Right wings */}
      <path
        d="M24 24 C32 11, 44 15, 42 25 C40 32, 32 32, 24 27"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <path
        d="M24 27 C30 30, 40 38, 36 42 C32 45, 26 38, 24 30"
        fill="currentColor"
        fillOpacity="0.22"
      />
      {/* Body & Antennae */}
      <path d="M24 19 L24 34" strokeWidth="2" />
      <path d="M24 19 C22 13, 17 12, 15 13" />
      <path d="M24 19 C26 13, 31 12, 33 13" />
    </svg>
  );
}

function OpenBookSvg() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="100%"
      height="100%"
    >
      <path
        d="M24 37 C18 34, 10 34, 6 36 L6 13 C10 11, 18 11, 24 14 C30 11, 38 11, 42 13 L42 36 C38 34, 30 34, 24 37 Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path d="M24 14 L24 37" />
      <path d="M12 21 C16 19, 20 20, 24 22" strokeOpacity="0.6" />
      <path d="M12 27 C16 25, 20 26, 24 28" strokeOpacity="0.6" />
      <path d="M36 21 C32 19, 28 20, 24 22" strokeOpacity="0.6" />
      <path d="M36 27 C32 25, 28 26, 24 28" strokeOpacity="0.6" />
    </svg>
  );
}

function BookshelfSvg() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="100%"
      height="100%"
    >
      <rect
        x="8"
        y="6"
        width="32"
        height="36"
        rx="4"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <path d="M8 24 L40 24" strokeWidth="2" />
      {/* Top shelf books */}
      <path d="M13 14 L13 24 M17 11 L17 24 M21 13 L21 24 M25 10 L25 24 M28 15 L32 24" strokeWidth="2" strokeOpacity="0.75" />
      {/* Bottom shelf books */}
      <path d="M13 29 L13 42 M17 31 L17 42 M20 28 L20 42 M24 32 L24 42 M28 30 L28 42 M31 29 L35 42" strokeWidth="2" strokeOpacity="0.75" />
    </svg>
  );
}

function BookStackSvg() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="100%"
      height="100%"
    >
      <rect x="7" y="32" width="34" height="8" rx="2" fill="currentColor" fillOpacity="0.22" />
      <path d="M14 32 L14 40" />
      <rect x="10" y="22" width="28" height="8" rx="2" fill="currentColor" fillOpacity="0.26" />
      <path d="M16 22 L16 30" />
      <rect x="13" y="12" width="22" height="8" rx="2" fill="currentColor" fillOpacity="0.2" />
      <path d="M18 12 L18 20" />
    </svg>
  );
}

function QuillSvg() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="100%"
      height="100%"
    >
      <path
        d="M38 6 C24 10, 14 24, 10 38 L14 38 C18 28, 28 18, 38 6 Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path d="M38 6 L10 38" />
      <path d="M10 38 L8 42 L12 40" strokeWidth="2" />
    </svg>
  );
}

export default function HomeAmbient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse tracking for subtle glow follow
    let mouseX = width / 2;
    let mouseY = height / 3;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Create warm sunlit library dust motes
    const colors = [
      "rgba(245, 175, 110, ", // warm honey amber
      "rgba(235, 150, 160, ", // soft blush rose
      "rgba(250, 205, 130, ", // golden sunlight
      "rgba(200, 175, 220, ", // twilight lavender
    ];

    const particleCount = Math.min(38, Math.floor(width / 36));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = Math.random() * 0.45 + 0.15;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        baseAlpha,
        alpha: baseAlpha,
        speedY: Math.random() * 0.35 + 0.15,
        speedX: (Math.random() - 0.5) * 0.2,
        sinOffset: Math.random() * Math.PI * 2,
        sinSpeed: Math.random() * 0.015 + 0.005,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse damping
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Draw subtle interactive cursor warmth
      const cursorGlow = ctx.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        380
      );
      cursorGlow.addColorStop(0, "rgba(255, 220, 180, 0.18)");
      cursorGlow.addColorStop(0.5, "rgba(250, 200, 210, 0.07)");
      cursorGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = cursorGlow;
      ctx.fillRect(0, 0, width, height);

      // Render floating warm particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.y -= p.speedY;
          p.x += Math.sin(time + p.sinOffset) * 0.4 + p.speedX;
          p.alpha =
            p.baseAlpha + Math.sin(time * 2 + p.sinOffset) * (p.baseAlpha * 0.3);

          // Wrap around edges
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, p.alpha)})`;
        ctx.shadowColor = `${p.color}0.6)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="home-ambient-wrap" aria-hidden="true">
      {/* Dynamic Floating Color Blobs */}
      <div className="home-ambient-orb orb-amber" />
      <div className="home-ambient-orb orb-rose" />
      <div className="home-ambient-orb orb-honey" />
      <div className="home-ambient-orb orb-lavender" />
      <div className="home-ambient-orb orb-peach" />

      {/* Floating Literary Motifs (Butterflies, Books, Bookshelves) */}
      <div className="home-floating-elements">
        {/* Butterfly 1 (Upper Left, Rose Flutter) */}
        <div className="home-floating-motif motif-butterfly-1">
          <ButterflySvg />
        </div>

        {/* Butterfly 2 (Mid Right, Amber Flight) */}
        <div className="home-floating-motif motif-butterfly-2">
          <ButterflySvg />
        </div>

        {/* Butterfly 3 (Lower Left, Soft Sage) */}
        <div className="home-floating-motif motif-butterfly-3">
          <ButterflySvg />
        </div>

        {/* Floating Open Book 1 (Near Hero Right) */}
        <div className="home-floating-motif motif-book-1">
          <OpenBookSvg />
        </div>

        {/* Floating Open Book 2 (Near Cabinets Left) */}
        <div className="home-floating-motif motif-book-2">
          <OpenBookSvg />
        </div>

        {/* Bookshelf / Cabinet 1 (Mid Left, Warm Wood) */}
        <div className="home-floating-motif motif-cabinet-1">
          <BookshelfSvg />
        </div>

        {/* Bookshelf / Cabinet 2 (Lower Right, Lavender) */}
        <div className="home-floating-motif motif-cabinet-2">
          <BookshelfSvg />
        </div>

        {/* Stack of Books (Upper Right) */}
        <div className="home-floating-motif motif-stack-1">
          <BookStackSvg />
        </div>

        {/* Quill Feather (Center Left) */}
        <div className="home-floating-motif motif-quill-1">
          <QuillSvg />
        </div>
      </div>

      {/* Interactive Light Particles & Cursor Glow */}
      <canvas ref={canvasRef} className="home-ambient-canvas" />

      {/* Soft Paper Grain Overlay */}
      <div className="home-ambient-grain" />
    </div>
  );
}
