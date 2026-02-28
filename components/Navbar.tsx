"use client";
import Link from "next/link";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

export function Navbar() {
  const { user, isLoaded } = useUser();
  return (
    <header className="bg-navy text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight">EnviroConnect</Link>
          <nav className="flex items-center gap-6">
            <Link href="/directory" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">
              Find Vendors
            </Link>
            {isLoaded && (
              user ? (
                <div className="flex items-center gap-4">
                  <Link href="/dashboard" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">Dashboard</Link>
                  <SignOutButton>
                    <button className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors">Sign Out</button>
                  </SignOutButton>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <SignInButton mode="modal">
                    <button className="text-sm font-medium text-gray-200 hover:text-white transition-colors">Sign In</button>
                  </SignInButton>
                  <Link href="/sign-up" className="text-sm bg-green hover:bg-green-light px-4 py-2 rounded font-medium transition-colors">
                    Get Listed
                  </Link>
                </div>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
