"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { HeroScroll } from "@/components/landing/HeroScroll";
import { SplitCollapse } from "@/components/landing/SplitCollapse";
import { StatsGrid } from "@/components/landing/StatsGrid";
import {
  MapPin,
  Shield,
  CheckCircle,
  Users,
  FileText,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Browse the Directory",
    description:
      "Search by service type, region, or certification. Every vendor is pre-vetted.",
  },
  {
    number: "02",
    title: "Review Profiles",
    description:
      "See certifications, service areas, descriptions, and contact info — all in one place.",
  },
  {
    number: "03",
    title: "Connect Directly",
    description:
      "Reach out to qualified vendors without cold calls or middlemen.",
  },
  {
    number: "04",
    title: "Get Proposals",
    description:
      "Post a Request for Quote and receive proposals from qualified vendors.",
  },
];

const features = [
  {
    title: "PNW-Focused",
    description:
      "Purpose-built for Washington and Oregon's unique environmental regulatory landscape.",
    Icon: MapPin,
  },
  {
    title: "Pre-Vetted Vendors",
    description:
      "Every listed vendor meets baseline professional and certification standards.",
    Icon: Shield,
  },
  {
    title: "Compliance-First",
    description:
      "Services organized around real compliance needs — stormwater, air quality, hazmat, and more.",
    Icon: CheckCircle,
  },
  {
    title: "Direct Connections",
    description:
      "Connect with vendors directly. No middlemen, no referral fees, no gatekeepers.",
    Icon: Users,
  },
  {
    title: "RFQ System",
    description:
      "Post Requests for Quote to get competitive proposals from vetted vendors — fast.",
    Icon: FileText,
  },
];

const services = [
  "Stormwater Management",
  "Dangerous Waste Compliance",
  "Air Quality / Emissions",
  "Spill Prevention (SPCC)",
  "Refrigerant Management",
  "Environmental Site Assessments",
  "Asbestos / Lead Abatement",
  "Emergency Response / HAZMAT",
];

export default function LandingPage() {
  return (
    <main>
      {/* Custom cursor — desktop only */}
      <CustomCursor />

      {/* ── 1. GSAP Hero Scroll ── */}
      <HeroScroll />

      {/* ── 2. Trust Bar ── */}
      <section className="bg-cloud py-8 px-4 border-b border-mist">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "8+", label: "Service Categories" },
            { value: "PNW-Wide", label: "Coverage Area" },
            { value: "Free", label: "For Facility Managers" },
            { value: "Direct", label: "No Middlemen" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-heading font-bold text-primary">
                {stat.value}
              </p>
              <p className="text-xs text-slate-custom mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. GSAP Split Collapse ── */}
      <SplitCollapse />

      {/* ── 4. How It Works ── */}
      <section className="bg-cloud py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-heading font-bold text-text-deep text-center mb-4">
              How It Works
            </h2>
            <p className="text-slate-custom text-center mb-12 max-w-xl mx-auto">
              Skip the Google rabbit holes and cold calls. Find qualified
              environmental vendors in minutes.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 0.1}>
                <div className="bg-surface rounded-lg p-8 border border-mist hover:-translate-y-1 hover:shadow-lg hover:border-mist-hover transition-all duration-200 relative flex gap-4">
                  <div className="absolute left-0 top-6 bottom-6 w-1 bg-accent rounded-full" />
                  <div className="pl-4">
                    <span className="inline-block bg-accent-surface text-accent text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                      {step.number}
                    </span>
                    <h3 className="text-xl font-heading font-semibold text-text-deep mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-custom">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Why EnviroConnect ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-heading font-bold text-text-deep text-center mb-4">
              Why EnviroConnect
            </h2>
            <p className="text-slate-custom text-center mb-12 max-w-xl mx-auto">
              Built specifically for the Pacific Northwest&apos;s industrial
              environmental compliance market.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 0.1}>
                <div className="bg-surface rounded-lg p-8 border border-mist hover:-translate-y-1 hover:shadow-lg hover:border-mist-hover transition-all duration-200">
                  <div className="w-12 h-12 rounded-lg bg-accent-surface flex items-center justify-center mb-4">
                    <feature.Icon size={24} strokeWidth={1.5} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-text-deep mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-custom">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Services Covered ── */}
      <section className="bg-cloud py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-heading font-bold text-text-deep text-center mb-12">
              Environmental Services Covered
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service) => (
                <div
                  key={service}
                  className="bg-surface border border-mist rounded-lg px-4 py-3 text-sm font-medium text-primary-light text-center hover:border-accent hover:text-accent hover:-translate-y-0.5 transition-all duration-200"
                >
                  {service}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 7. Devin-style Stats Grid ── */}
      <StatsGrid />

      {/* ── 8. Vendor CTA ── */}
      <section className="bg-primary py-24 px-4 text-white text-center">
        <ScrollReveal className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Are You a Vendor?
          </h2>
          <p className="text-white/70 mb-3">
            Get in front of qualified facility managers who are actively looking
            for your services.
          </p>
          <p className="text-white/70 mb-8">
            Listing is free during our launch period.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Create Your Free Profile
          </Link>
        </ScrollReveal>
      </section>
    </main>
  );
}
