"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type StatVariant = "primary" | "light" | "accent";

interface Stat {
  value: string;
  numericValue: number | null;
  label: string;
  description: string;
  variant: StatVariant;
}

const STATS: Stat[] = [
  {
    value: "8+",
    numericValue: 8,
    label: "Service Categories",
    description: "From stormwater to air quality",
    variant: "primary",
  },
  {
    value: "PNW-Wide",
    numericValue: null,
    label: "Coverage",
    description: "Washington & Oregon",
    variant: "light",
  },
  {
    value: "Free",
    numericValue: null,
    label: "For Facility Managers",
    description: "Always free to browse and connect",
    variant: "accent",
  },
  {
    value: "Direct",
    numericValue: null,
    label: "No Middlemen",
    description: "Connect directly with vendors",
    variant: "light",
  },
  {
    value: "25+",
    numericValue: 25,
    label: "Pre-vetted Vendors",
    description: "Verified compliance specialists",
    variant: "primary",
  },
];

const CARD_PADDINGS = ["p-8", "p-6", "p-10", "p-6", "p-8"] as const;

const VARIANT_CLASSES: Record<StatVariant, string> = {
  primary: "bg-[#1C3144] text-white",
  light: "bg-[#F0F4F8] text-[#0F1D2B] border border-[#D5DDE5]",
  accent: "bg-gradient-to-br from-[#4A7C59] to-[#3D6649] text-white",
};

const VALUE_CLASSES: Record<StatVariant, string> = {
  primary: "text-white",
  light: "text-[#0F1D2B]",
  accent: "text-white",
};

const LABEL_CLASSES: Record<StatVariant, string> = {
  primary: "text-white/70",
  light: "text-[#4A5568]",
  accent: "text-white/70",
};

export function StatsGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const ctx = gsap.context(() => {
      // Stagger fade-in on scroll
      gsap.from(cards, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: grid,
          start: "top 80%",
          once: true,
          onEnter: () => {
            // Kick off counter animations after cards start appearing
            STATS.forEach((stat, index) => {
              if (stat.numericValue === null) return;

              const valueEl = valueRefs.current[index];
              if (!valueEl) return;

              const suffix = stat.value.replace(String(stat.numericValue), "");
              const counter = { val: 0 };

              gsap.to(counter, {
                val: stat.numericValue,
                duration: 1.6,
                delay: index * 0.1,
                ease: "power2.out",
                snap: { val: 1 },
                onUpdate: () => {
                  valueEl.textContent = `${Math.round(counter.val)}${suffix}`;
                },
              });
            });
          },
        },
      });
    }, grid);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-heading font-bold text-[#0F1D2B] text-center mb-12">
          By the Numbers
        </h2>

        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={[
                "rounded-xl shadow-md flex flex-col justify-between",
                CARD_PADDINGS[index],
                VARIANT_CLASSES[stat.variant],
              ].join(" ")}
            >
              <div>
                <span
                  ref={(el) => {
                    valueRefs.current[index] = el;
                  }}
                  className={[
                    "text-4xl md:text-5xl font-heading font-bold block",
                    VALUE_CLASSES[stat.variant],
                  ].join(" ")}
                >
                  {stat.value}
                </span>
                <p className={["text-sm mt-2 opacity-70", LABEL_CLASSES[stat.variant]].join(" ")}>
                  {stat.description}
                </p>
              </div>

              <p
                className={[
                  "text-xs uppercase tracking-wider mt-4 opacity-60",
                  LABEL_CLASSES[stat.variant],
                ].join(" ")}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
