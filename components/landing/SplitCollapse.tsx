"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leaf } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function SplitCollapse() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const leafIconRef = useRef<HTMLDivElement>(null);

  const [displayNumber, setDisplayNumber] = useState(25);
  const [subtitle, setSubtitle] = useState("Pre-vetted Vendors");

  useEffect(() => {
    const section = sectionRef.current;
    const leftCol = leftColRef.current;
    const rightCol = rightColRef.current;
    const leftContent = leftContentRef.current;
    const leafIcon = leafIconRef.current;

    if (!section || !leftCol || !rightCol || !leftContent || !leafIcon) return;

    // Set initial inline widths that GSAP will animate.
    // CSS grid/flex is overridden here because GSAP needs to tween numeric values.
    gsap.set(leftCol, { width: "50%" });
    gsap.set(rightCol, { width: "50%" });
    gsap.set(leafIcon, { autoAlpha: 0, y: 12 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          // Scrub the counter from 25 → 8
          const interpolated = gsap.utils.interpolate(25, 8, progress);
          setDisplayNumber(Math.round(interpolated));

          // Swap subtitle text at 50% progress
          setSubtitle(
            progress < 0.5 ? "Pre-vetted Vendors" : "Service Categories"
          );
        },
      },
    });

    tl
      // Phase 1 (0% → 80%): collapse left, expand right
      .to(
        leftCol,
        {
          width: "5%",
          ease: "power2.inOut",
        },
        0
      )
      .to(
        rightCol,
        {
          width: "95%",
          ease: "power2.inOut",
        },
        0
      )
      // Fade out the left column text content as it collapses
      .to(
        leftContent,
        {
          autoAlpha: 0,
          ease: "power1.in",
          duration: 0.3,
        },
        0
      )
      // Phase 2 (80% → 100%): fade in the leaf icon
      .to(
        leafIcon,
        {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.2,
        },
        0.8
      );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Pacific Northwest marketplace overview"
      className="min-h-screen relative overflow-hidden flex"
    >
      {/* Left column — Cloud background, collapses on scroll */}
      <div
        ref={leftColRef}
        className="relative overflow-hidden flex-shrink-0"
        style={{ backgroundColor: "#F0F4F8", width: "50%" }}
      >
        <div
          ref={leftContentRef}
          className="flex flex-col justify-center h-full px-12 py-16 min-w-[340px]"
        >
          <p className="text-sm uppercase tracking-wider text-[#6E8CA0] mb-3 font-body">
            Built for the
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#0F1D2B] mb-6 leading-tight">
            Pacific Northwest
          </h2>
          <p className="text-[#6E8CA0] text-lg leading-relaxed max-w-md font-body">
            The region&apos;s first dedicated marketplace connecting industrial
            facility managers with pre-vetted environmental compliance service
            providers.
          </p>
        </div>
      </div>

      {/* Right column — Hero image, expands on scroll */}
      <div
        ref={rightColRef}
        className="relative overflow-hidden flex-shrink-0"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "50%",
        }}
      >
        {/* Dark scrim so white text stays legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Counter + subtitle — pinned to bottom-left of the image panel */}
        <div className="absolute bottom-10 left-10 z-10">
          <div className="flex flex-col items-start gap-1">
            {/* Animated number */}
            <span
              ref={numberRef}
              className="text-7xl md:text-9xl font-heading font-bold text-white leading-none tabular-nums"
              aria-live="polite"
              aria-label={`${displayNumber}+`}
            >
              {displayNumber}+
            </span>

            {/* Subtitle — swaps at 50% scroll progress */}
            <span
              ref={subtitleRef}
              className="text-lg text-white/80 font-body tracking-wide"
            >
              {subtitle}
            </span>

            {/* Leaf icon — fades in near end of animation */}
            <div
              ref={leafIconRef}
              className="mt-3"
              aria-hidden="true"
              style={{ opacity: 0 }}
            >
              <Leaf
                size={28}
                color="#4A7C59"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
