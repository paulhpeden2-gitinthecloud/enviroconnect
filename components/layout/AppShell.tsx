"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  Calendar,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

const MOBILE_TABS = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
  { icon: Search, label: "Directory", href: "/directory" },
  { icon: FileText, label: "RFQs", href: "/rfq" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Calendar, label: "Meetings", href: "/meetings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Sidebar — hidden below md, fixed on md+ */}
      <Sidebar />

      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={handleCloseSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={[
          "fixed top-0 left-0 h-full z-50 md:hidden transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Mobile navigation"
      >
        <Sidebar />
      </div>

      {/* Main column: TopBar + content */}
      <div className="ml-0 md:ml-16 lg:ml-60 flex flex-col min-h-screen">
        {/* TopBar */}
        <TopBar onToggleSidebar={handleToggleSidebar} />

        {/* Scrollable content area */}
        <main className="flex-1 p-4 md:p-6 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] border-t border-[#D5DDE5] h-14"
        aria-label="Mobile tab bar"
      >
        <ul className="flex items-center justify-around h-full">
          {MOBILE_TABS.map(({ icon: Icon, label, href }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === href || pathname.startsWith("/dashboard")
                : pathname.startsWith(href);

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={[
                    "flex flex-col items-center justify-center gap-0.5 h-full w-full text-xs font-medium transition-colors",
                    isActive ? "text-[#4A7C59]" : "text-[#6E8CA0]",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
