"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const createUser = useMutation(api.users.mutations.createUser);
  const [role, setRole] = useState<"vendor" | "facility_manager" | "">("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !company.trim() || !user) return;
    setLoading(true);
    setError("");
    try {
      await createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? user.username ?? "",
        role,
        company: company.trim(),
      });
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-12 px-4">
      <div className="bg-white dark:bg-navy-light rounded-xl shadow-sm border border-cream-dark p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-navy mb-2">
          Welcome to EnviroConnect
        </h1>
        <p className="text-gray-500 mb-8">
          Tell us a bit about yourself to get started.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "vendor",
                  label: "Vendor",
                  desc: "I provide environmental services",
                },
                {
                  value: "facility_manager",
                  label: "Facility Manager",
                  desc: "I manage a facility",
                },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setRole(opt.value as typeof role)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    role === opt.value
                      ? "border-navy bg-navy/5"
                      : "border-cream-dark hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-navy text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
              required
              className="w-full border border-cream-dark rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!role || !company.trim() || loading}
            className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Setting up your account…" : "Get Started"}
          </button>
        </form>
      </div>
    </main>
  );
}
