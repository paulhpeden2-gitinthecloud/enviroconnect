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
    <main className="min-h-screen bg-cloud flex items-center justify-center py-12 px-4">
      <div className="bg-surface border border-mist rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-text-deep font-heading mb-2">
          Welcome to EnviroConnect
        </h1>
        <p className="text-slate-custom mb-8">
          Tell us a bit about yourself to get started.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-deep mb-3">
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
                      ? "bg-accent text-white border-accent"
                      : "bg-surface border-mist text-text-deep hover:border-accent/50"
                  }`}
                >
                  <p
                    className={`font-semibold text-sm ${
                      role === opt.value ? "text-white" : "text-text-deep"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      role === opt.value ? "text-white/80" : "text-slate-custom"
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-deep mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
              required
              className="w-full bg-surface border border-mist rounded-md px-4 py-2.5 text-sm text-text-deep placeholder:text-slate-custom focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-focus-ring/40 transition-colors"
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!role || !company.trim() || loading}
            className="bg-accent hover:bg-accent-hover text-white rounded-lg font-medium w-full py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? "Setting up your account…" : "Get Started"}
          </button>
        </form>
      </div>
    </main>
  );
}
