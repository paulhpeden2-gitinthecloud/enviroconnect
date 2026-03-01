"use client";
import { useState } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user, isLoaded } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      <Link href="/directory" onClick={() => setMobileOpen(false)} className="block md:inline text-sm font-medium text-gray-200 hover:text-white py-2 md:py-0 transition-colors">
        Find Vendors
      </Link>
      <Link href="/about" onClick={() => setMobileOpen(false)} className="block md:inline text-sm font-medium text-gray-200 hover:text-white py-2 md:py-0 transition-colors">
        About
      </Link>
    </>
  );

  const authSection = isLoaded && (
    user ? (
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-200 hover:text-white py-2 md:py-0 transition-colors">
          Dashboard
        </Link>
        <SignOutButton>
          <button className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-left md:text-center">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    ) : (
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <SignInButton mode="modal">
          <button className="text-sm font-medium text-gray-200 hover:text-white py-2 md:py-0 transition-colors text-left md:text-center">
            Sign In
          </button>
        </SignInButton>
        <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="text-sm bg-green hover:bg-green-light px-4 py-2 rounded font-medium transition-colors text-center">
          Get Listed
        </Link>
      </div>
    )
  );

  return (
    <header className="bg-navy text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            EnviroConnect
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            {navLinks}
            <ThemeToggle />
            {authSection}
          </nav>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <nav className="md:hidden bg-navy border-t border-white/10 px-4 py-4 space-y-1">
          {navLinks}
          <div className="flex items-center py-2">
            <ThemeToggle />
          </div>
          {authSection}
        </nav>
      )}
    </header>
  );
}
