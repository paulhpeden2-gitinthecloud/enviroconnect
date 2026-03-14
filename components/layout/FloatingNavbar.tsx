"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Find Vendors", href: "/directory" },
  { label: "RFQs", href: "/rfq" },
  { label: "About", href: "/about" },
];

export default function FloatingNavbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const bgClass = scrolled
    ? "bg-[#1C3144]/90"
    : "bg-[#1C3144]/70";

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full backdrop-blur-md border border-white/10 transition-colors duration-300 ${bgClass}`}
    >
      {/* Main bar */}
      <div className="flex items-center justify-between px-6 py-3">

        {/* Left: Wordmark */}
        <Link
          href="/"
          className="font-bold text-white text-lg tracking-tight shrink-0 font-heading"
          aria-label="EnviroConnect home"
        >
          EnviroConnect
        </Link>

        {/* Center: Desktop nav links */}
        <ul
          className="hidden md:flex items-center gap-6"
          role="list"
        >
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} className="relative flex flex-col items-center gap-0.5">
                <Link
                  href={href}
                  className={`text-sm transition-colors duration-200 ${
                    isActive
                      ? "text-white font-medium"
                      : "text-white/80 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
                {/* Active dot indicator */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#4A7C59]"
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* Right: Auth controls (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-white/80 hover:text-white transition-colors duration-200"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="text-sm text-white/80 hover:text-white transition-colors duration-200"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-white/80 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm text-white font-medium px-4 py-1.5 rounded-full bg-[#4A7C59] hover:bg-[#3D6649] transition-colors duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Hamburger toggle */}
        <button
          className="md:hidden text-white/80 hover:text-white transition-colors duration-200 p-1"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile: Slide-down panel */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-label="Mobile navigation"
          className="md:hidden px-6 pb-5 pt-2 border-t border-white/10 rounded-b-3xl flex flex-col gap-4"
        >
          <ul role="list" className="flex flex-col gap-3">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href} className="flex items-center gap-2">
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] shrink-0"
                    />
                  )}
                  <Link
                    href={href}
                    className={`text-sm transition-colors duration-200 ${
                      isActive
                        ? "text-white font-medium"
                        : "text-white/80 hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-white/80 hover:text-white transition-colors duration-200 text-center py-2 border border-white/20 rounded-full hover:border-white/40"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="text-sm text-white/80 hover:text-white transition-colors duration-200 text-center py-2 border border-white/20 rounded-full hover:border-white/40"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm text-white/80 hover:text-white transition-colors duration-200 text-center py-2 border border-white/20 rounded-full hover:border-white/40"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm text-white font-medium text-center py-2 rounded-full bg-[#4A7C59] hover:bg-[#3D6649] transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
