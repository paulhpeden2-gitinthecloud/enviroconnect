"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const isHoverCapable = useRef<boolean>(false);

  useEffect(() => {
    isHoverCapable.current = window.matchMedia("(hover: hover)").matches;

    if (!isHoverCapable.current) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    // Hide the default system cursor on body
    document.body.style.cursor = "none";

    // GSAP quickTo setters for smooth follow
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      // Offset by half the cursor size (w-8 = 32px) so the circle is centered on the pointer
      xTo(e.clientX - 16);
      yTo(e.clientY - 16);
    };

    // Event delegation — match interactive elements
    const isInteractive = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return target.closest("a, button") !== null;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      if (isInteractive(e.target)) {
        gsap.to(cursor, { scale: 1.5, duration: 0.2, ease: "power2.out" });
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (isInteractive(e.target)) {
        gsap.to(cursor, { scale: 1, duration: 0.2, ease: "power2.out" });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter, true);
    document.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter, true);
      document.removeEventListener("mouseleave", handleMouseLeave, true);
      gsap.killTweensOf(cursor);
    };
  }, []);

  // Render nothing on touch/non-hover devices — evaluated after mount
  // The div is always in the DOM on capable devices; the effect controls visibility
  if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] pointer-events-none w-8 h-8 rounded-full border border-white/50 bg-white/10"
    />
  );
}
