import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";

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
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8 text-green mb-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
  },
  {
    title: "Pre-Vetted Vendors",
    description:
      "Every listed vendor meets baseline professional and certification standards.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8 text-green mb-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: "Compliance-First",
    description:
      "Services organized around real compliance needs — stormwater, air quality, hazmat, and more.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8 text-green mb-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Direct Connections",
    description:
      "Connect with vendors directly. No middlemen, no referral fees, no gatekeepers.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8 text-green mb-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    title: "RFQ System",
    description:
      "Post Requests for Quote to get competitive proposals from vetted vendors — fast.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8 text-green mb-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
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

const stats = [
  { value: "8+", label: "Service Categories" },
  { value: "PNW-Wide", label: "Coverage Area" },
  { value: "Free", label: "For Facility Managers" },
  { value: "Direct", label: "No Middlemen" },
];

export default function LandingPage() {
  return (
    <main>
      {/* ── 1. Hero ── */}
      <section
        className="relative bg-cover bg-center py-32 px-4"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/85 to-navy/70" />

        {/* Content */}
        <ScrollReveal className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Find Environmental Compliance Vendors You Can Trust
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            A curated directory of pre-vetted environmental consultants and
            service providers across the Pacific Northwest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/directory"
              className="bg-green hover:bg-green-light text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Browse Vendors
            </Link>
            <Link
              href="/sign-up"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors border border-white/20"
            >
              Get Started
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 2. How It Works ── */}
      <section className="bg-cream py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-navy text-center mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
              Skip the Google rabbit holes and cold calls. Find qualified
              environmental vendors in minutes.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 0.1}>
                <div className="bg-white dark:bg-navy-light rounded-xl p-8 border border-cream-dark hover:-translate-y-1 hover:shadow-md transition-all duration-200 relative flex gap-4">
                  {/* Green accent bar */}
                  <div className="absolute left-0 top-6 bottom-6 w-1 bg-green rounded-full" />

                  <div className="pl-4">
                    <span className="inline-block bg-green/10 text-green text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                      {step.number}
                    </span>
                    <h3 className="text-xl font-semibold text-navy mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Why EnviroConnect ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-navy text-center mb-4">
              Why EnviroConnect
            </h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
              Built specifically for the Pacific Northwest&apos;s industrial
              environmental compliance market.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 0.1}>
                <div className="bg-white dark:bg-navy-light rounded-xl p-8 border border-cream-dark hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  {feature.icon}
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Services Grid ── */}
      <section className="bg-cream-dark/30 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-navy text-center mb-12">
              Environmental Services Covered
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service) => (
                <div
                  key={service}
                  className="bg-white dark:bg-navy-light border border-cream-dark rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-center hover:border-green hover:text-green hover:-translate-y-0.5 transition-all duration-200"
                >
                  {service}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. Value Stats Bar ── */}
      <section className="bg-navy py-16 px-4">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── 6. Vendor CTA ── */}
      <section className="bg-navy-light py-24 px-4 text-white text-center">
        <ScrollReveal className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Are You a Vendor?</h2>
          <p className="text-gray-300 mb-3">
            Get in front of qualified facility managers who are actively looking
            for your services.
          </p>
          <p className="text-gray-300 mb-8">
            Listing is free during our launch period.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-green hover:bg-green-light text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Create Your Free Profile
          </Link>
        </ScrollReveal>
      </section>
    </main>
  );
}
