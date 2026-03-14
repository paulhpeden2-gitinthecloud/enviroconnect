"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import FloatingNavbar from "@/components/layout/FloatingNavbar";
import { Footer } from "@/components/layout/Footer";
import AppShell from "@/components/layout/AppShell";

const PUBLIC_ROUTES = ["/", "/about", "/directory", "/sign-in", "/sign-up"];

const APP_ROUTES = [
  "/dashboard",
  "/messages",
  "/meetings",
  "/rfq",
  "/onboarding",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );
}

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some((route) => pathname.startsWith(route));
}

export default function LayoutSwitch({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();

  if (!isLoaded) {
    return <div className="min-h-screen bg-cloud" />;
  }

  const publicRoute = isPublicRoute(pathname);
  const appRoute = isAppRoute(pathname);

  if (isSignedIn && appRoute && !publicRoute) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <>
      <FloatingNavbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
