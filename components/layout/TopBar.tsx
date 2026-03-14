"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Menu, User } from "lucide-react";
import Image from "next/image";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatIcon } from "@/components/messaging/ChatIcon";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "Dashboard";
  }
  if (pathname === "/directory" || pathname.startsWith("/directory/")) {
    return "Directory";
  }
  if (pathname === "/rfq" || pathname.startsWith("/rfq/")) {
    return "RFQs";
  }
  if (pathname === "/messages") {
    return "Messages";
  }
  if (pathname === "/meetings") {
    return "Meetings";
  }
  if (pathname === "/onboarding") {
    return "Welcome";
  }
  return "EnviroConnect";
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.queries.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="h-14 bg-surface border-b border-mist sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="md:hidden flex items-center justify-center text-text-deep hover:opacity-70 transition-opacity"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar navigation"
        >
          <Menu size={22} />
        </button>

        <h1 className="font-heading font-semibold text-text-deep text-lg">
          {pageTitle}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {dbUser && (
          <>
            <NotificationBell userId={dbUser._id} />
            <ChatIcon userId={dbUser._id} />
          </>
        )}

        {user?.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={user.fullName ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full object-cover w-8 h-8"
          />
        ) : (
          <div className="bg-cloud rounded-full w-8 h-8 flex items-center justify-center">
            <User size={16} className="text-text-deep" />
          </div>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
