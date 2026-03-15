"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const dbUser = useQuery(
    api.users.queries.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    if (dbUser === undefined) return;
    if (!dbUser) { router.push("/onboarding"); return; }
    router.push(dbUser.role === "vendor" ? "/dashboard/vendor" : "/dashboard/facility");
  }, [isLoaded, user, dbUser, router]);

  return (
    <div className="min-h-screen bg-cloud">
      <div className="fixed top-0 left-0 right-0 h-1 bg-accent/20 overflow-hidden z-50">
        <div className="h-full w-1/3 bg-accent rounded-full animate-pulse" />
      </div>
    </div>
  );
}
