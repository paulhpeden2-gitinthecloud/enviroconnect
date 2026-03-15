"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Use useLayoutEffect on the client, fall back to useEffect on the server (SSR safety)
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const textContainer = textContainerRef.current;

    if (!section || !textContainer) return;

    // Set initial state: text starts above the viewport
    gsap.set(textContainer, { y: "-100%" });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        // Scrub from -100% (above viewport) to 0% (in place) over the first half of the scroll,
        // then continue to +30% (drifts slightly down) for a parallax finish.
        const progress = self.progress;
        const yPercent = gsap.utils.interpolate(-100, 30, progress);
        gsap.set(textContainer, { y: `${yPercent}%` });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="h-screen w-full relative overflow-hidden"
      aria-label="Hero section"
      style={{
        backgroundImage: "url('/images/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"
        aria-hidden="true"
      />

      {/* Text container — starts translated above the viewport, scrubs into view */}
      <div
        ref={textContainerRef}
        className="absolute inset-x-0 top-0 flex flex-col items-center justify-start pt-24 md:pt-32 gap-6 px-6 text-center z-10"
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white uppercase tracking-tight font-heading">
          ENVIROCONNECT
        </h1>

        <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
          Connecting Industrial Facilities with Pre-Vetted Environmental
          Compliance Vendors
        </p>

        <div
          className="flex flex-col sm:flex-row items-center gap-4 mt-2"
          role="group"
          aria-label="Primary actions"
        >
          <Link
            href="/directory"
            className="bg-[#4A7C59] hover:bg-[#3D6649] text-white px-6 py-3 rounded-full font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Browse Vendors
          </Link>

          <Link
            href="/sign-up"
            className="border border-white/30 hover:border-white/60 text-white px-6 py-3 rounded-full font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
