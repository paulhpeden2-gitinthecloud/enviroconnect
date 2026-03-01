"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollReveal } from "@/components/ScrollReveal";

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const faqs = [
  {
    question: "What is EnviroConnect?",
    answer:
      "EnviroConnect is a curated online directory connecting Pacific Northwest industrial facility managers with pre-vetted environmental compliance vendors. We help facilities find qualified consultants for services like stormwater management, hazardous waste compliance, air quality, and more.",
  },
  {
    question: "Is it free to use?",
    answer:
      "Yes! Browsing the vendor directory is completely free for facility managers. Vendors can create a free listing during our launch period.",
  },
  {
    question: "How do I list my company?",
    answer:
      "Sign up for a free account, select 'Vendor' as your role during onboarding, and complete your company profile. Once published, your listing will appear in the directory for facility managers to discover.",
  },
  {
    question: "What regions do you cover?",
    answer:
      "We currently serve the Pacific Northwest, including Seattle Metro, Tacoma/South Sound, Portland Metro, Eastern Washington, and surrounding areas across Washington and Oregon.",
  },
  {
    question: "How are vendors vetted?",
    answer:
      "We verify that listed vendors hold relevant certifications and professional credentials. Our directory organizes vendors by service type, certification, and service area to help facility managers make informed decisions.",
  },
  {
    question: "How do I contact a vendor?",
    answer:
      "Each vendor profile includes their contact information — email, phone, and website. You can also save vendors to your dashboard for easy reference. Contact vendors directly through their listed information.",
  },
];

// ---------------------------------------------------------------------------
// Chevron icon
// ---------------------------------------------------------------------------

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`w-5 h-5 transform transition-transform duration-200${open ? " rotate-180" : ""}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// User avatar placeholder SVG
// ---------------------------------------------------------------------------

function UserAvatarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-10 h-10 text-gray-400"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AboutPage() {
  // Contact form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");

  // FAQ accordion state — null means all closed
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleFaqToggle(index: number) {
    setOpenFaq((prev) => (prev === index ? null : index));
  }

  function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = `From: ${name} (${email})\n\n${message}`;
    window.location.href = `mailto:contact@enviroconnect.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const inputClasses =
    "w-full border border-cream-dark rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-navy-light focus:outline-none focus:ring-2 focus:ring-navy/30";

  return (
    <main>
      {/* ── Section 1: Mission Hero ── */}
      <section className="bg-cream py-24 px-4">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-navy mb-6">
            Connecting the Pacific Northwest&apos;s Environmental Industry
          </h1>
          <div className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed space-y-4">
            <p>
              Finding qualified environmental compliance vendors shouldn&apos;t
              require cold calls, outdated referral lists, or hours of research.
              Yet for facility managers across Washington and Oregon, that&apos;s
              been the reality for decades.
            </p>
            <p>
              EnviroConnect changes that. We&apos;re building a curated directory
              of pre-vetted environmental consultants and service providers,
              organized around the compliance needs that matter most — from
              stormwater management to hazardous waste, air quality to emergency
              response.
            </p>
            <p>
              Our mission is simple: make it easy for industrial facilities to
              find the right environmental partners, and for qualified vendors to
              connect with the facilities that need them.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Section 2: Founder / Team ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-navy text-center mb-12">
              Our Team
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="max-w-md mx-auto bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-8 text-center">
              {/* Avatar placeholder */}
              <div className="w-24 h-24 bg-cream-dark rounded-full mx-auto mb-4 flex items-center justify-center">
                <UserAvatarIcon />
              </div>

              <p className="text-xl font-semibold text-navy">Your Name</p>
              <p className="text-sm text-green mt-1">Founder &amp; CEO</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
                Environmental compliance professional with a passion for
                connecting industry with qualified service providers across the
                Pacific Northwest.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Section 3: Contact Form ── */}
      <section id="contact" className="bg-cream-dark/30 py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-navy text-center mb-12">
              Get in Touch
            </h2>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-navy mb-1"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-sm font-medium text-navy mb-1"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  placeholder="you@company.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-sm font-medium text-navy mb-1"
                >
                  Subject
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClasses}
                >
                  <option>General Inquiry</option>
                  <option>Partnerships</option>
                  <option>Support</option>
                  <option>Feedback</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-navy mb-1"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={inputClasses}
                  placeholder="How can we help?"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="bg-green hover:bg-green-light text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full"
              >
                Send Message
              </button>
            </form>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Section 4: FAQ Accordion ── */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-navy text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-cream-dark rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleFaqToggle(index)}
                      className="w-full flex justify-between items-center p-5 text-left"
                    >
                      <span className="font-medium text-navy dark:text-white">
                        {faq.question}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="px-5 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
