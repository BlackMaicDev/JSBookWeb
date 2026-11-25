"use client";

import { useEffect } from "react";

export default function MotionEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const targets = document.querySelectorAll<HTMLElement>(
      ".bokk main > section:not(:first-child), .bokk .directory-card, .bokk .classics-card, .bokk .wuxia-book-list article, .bokk .romance-card, .bokk .manga-card, .bokk .crime-row, .bokk .blog-card, .bokk .home-blog-card"
    );
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

    targets.forEach((target) => {
      target.classList.add("will-reveal");
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
