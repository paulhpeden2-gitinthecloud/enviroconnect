"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  matchPrefix?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPrefix: true,
  },
  {
    label: "Directory",
    href: "/directory",
    icon: Search,
    matchPrefix: true,
  },
  {
    label: "RFQs",
    href: "/rfq",
    icon: FileText,
    matchPrefix: true,
  },
  {
    label: "Messages",
    href: "/messages",
    icon: MessageSquare,
    matchPrefix: true,
  },
  {
    label: "Meetings",
    href: "/meetings",
    icon: Calendar,
    matchPrefix: true,
  },
];

function isActiveRoute(pathname: string, href: string, matchPrefix?: boolean): boolean {
  if (matchPrefix) {
    return pathname === href || pathname.startsWith(href + "/");
  }
  return pathname === href;
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-16 lg:w-60 bg-surface border-r border-mist z-40 transition-all duration-200"
      aria-label="Primary navigation"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0 border-b border-mist">
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0"
          aria-label="EnviroConnect home"
        >
          <span className="font-heading font-bold text-primary text-lg leading-none hidden lg:block whitespace-nowrap">
            EnviroConnect
          </span>
          {/* Icon-only fallback when collapsed */}
          <span className="font-heading font-bold text-primary text-lg leading-none lg:hidden select-none">
            E
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1 py-4 overflow-y-auto" aria-label="Sidebar navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon, matchPrefix }) => {
          const active = isActiveRoute(pathname, href, matchPrefix);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 transition-colors duration-150",
                active
                  ? "bg-accent-surface text-accent border-l-[3px] border-accent pl-[13px]"
                  : "text-slate-custom hover:bg-cloud hover:text-text-deep border-l-[3px] border-transparent pl-[13px]",
              ].join(" ")}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0"
              />
              <span className="hidden lg:block text-sm font-medium leading-none whitespace-nowrap">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="mt-auto flex items-center justify-center lg:justify-start px-4 py-4 border-t border-mist shrink-0">
        <ThemeToggle />
        <span className="hidden lg:block ml-3 text-sm font-medium text-slate-custom whitespace-nowrap">
          Theme
        </span>
      </div>
    </aside>
  );
}
