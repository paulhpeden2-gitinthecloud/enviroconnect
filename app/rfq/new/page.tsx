"use client";
import { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { SERVICE_TYPES, SERVICE_AREAS, BUDGET_RANGES, TIMELINE_OPTIONS } from "@/lib/constants";
import Link from "next/link";

export default function CreateRfqPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream">
          <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
            <div className="h-8 bg-cream-dark rounded w-48 mb-8" />
            <div className="space-y-6">
              <div className="h-10 bg-cream-dark rounded" />
              <div className="h-32 bg-cream-dark rounded" />
              <div className="h-10 bg-cream-dark rounded w-1/2" />
            </div>
          </div>
        </main>
      }
    >
      <CreateRfqContent />
    </Suspense>
  );
}

function CreateRfqContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const createRfq = useMutation(api.rfqMutations.createRfq);

  const allVendors = useQuery(api.vendors.getVendorProfiles, { page: 1 });

  const [form, setForm] = useState({
    title: "",
    description: "",
    services: [] as string[],
    serviceArea: "",
    budgetRange: "",
    deadline: "",
    timeline: "",
    requirements: "",
  });
  const [invitedVendorIds, setInvitedVendorIds] = useState<string[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const inviteParam = searchParams.get("invite");

  useEffect(() => {
    if (inviteParam && !invitedVendorIds.includes(inviteParam)) {
      setInvitedVendorIds([inviteParam]);
    }
  }, [inviteParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const filteredVendors = allVendors?.profiles.filter(
    (v) =>
      !invitedVendorIds.includes(v._id) &&
      v.companyName.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!dbUser) return;
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (form.services.length === 0) { setError("Select at least one service type"); return; }
    if (!form.serviceArea) { setError("Select a service area"); return; }
    if (!form.deadline) { setError("Set a proposal deadline"); return; }
    if (!form.timeline) { setError("Select a timeline"); return; }

    setSaving(true);
    setError("");
    try {
      const rfqId = await createRfq({
        facilityManagerId: dbUser._id,
        title: form.title.trim(),
        description: form.description.trim(),
        services: form.services,
        serviceArea: form.serviceArea,
        budgetRange: form.budgetRange || undefined,
        deadline: new Date(form.deadline).getTime(),
        timeline: form.timeline,
        requirements: form.requirements.trim() || undefined,
        invitedVendors: invitedVendorIds.length > 0 ? invitedVendorIds as any : undefined,
      });
      router.push(`/rfq/${rfqId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create RFQ");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !dbUser) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-8 bg-cream-dark rounded w-48 mb-8" />
          <div className="space-y-6">
            <div className="h-10 bg-cream-dark rounded" />
            <div className="h-32 bg-cream-dark rounded" />
            <div className="h-10 bg-cream-dark rounded w-1/2" />
          </div>
        </div>
      </main>
    );
  }

  if (dbUser.role !== "facility_manager") {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Only facility managers can post RFQs.</p>
          <Link href="/rfq" className="text-navy font-medium underline hover:no-underline">
            Browse RFQs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Post a Request for Quote</h1>
          <p className="text-gray-300 text-sm mt-1">
            Describe what you need — matching vendors will be notified automatically
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Title */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Need SPCC Plan Update for Tacoma Facility"
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50"
          />
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the work you need done, including scope, location details, and any relevant background..."
            rows={5}
            maxLength={2000}
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 resize-vertical"
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-3">Services Needed *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SERVICE_TYPES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.services.includes(s)}
                  onChange={() => toggleService(s)}
                  className="rounded border-cream-dark text-green focus:ring-green"
                />
                <span className="text-gray-700 dark:text-gray-300">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Service Area, Budget, Deadline, Timeline */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Service Area *</label>
            <select
              value={form.serviceArea}
              onChange={(e) => setForm((prev) => ({ ...prev, serviceArea: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            >
              <option value="">Select region</option>
              {SERVICE_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Budget Range</label>
            <select
              value={form.budgetRange}
              onChange={(e) => setForm((prev) => ({ ...prev, budgetRange: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            >
              <option value="">Prefer not to say</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Proposal Deadline *</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Work Timeline *</label>
            <select
              value={form.timeline}
              onChange={(e) => setForm((prev) => ({ ...prev, timeline: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            >
              <option value="">Select timeline</option>
              {TIMELINE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Additional Requirements</label>
          <textarea
            value={form.requirements}
            onChange={(e) => setForm((prev) => ({ ...prev, requirements: e.target.value }))}
            placeholder="e.g. Must carry $2M general liability insurance, HAZWOPER certification required, bonding requirements..."
            rows={3}
            maxLength={1000}
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 resize-vertical"
          />
          <p className="text-xs text-gray-400 mt-1">{form.requirements.length}/1000</p>
        </div>

        {/* Invite Specific Vendors (optional) */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Invite Specific Vendors (optional)</label>
          <p className="text-xs text-gray-500 mb-3">
            All matching vendors will be notified automatically. Use this to additionally invite specific vendors.
          </p>
          <input
            type="text"
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendors by name..."
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 mb-2"
          />
          {vendorSearch && filteredVendors && filteredVendors.length > 0 && (
            <div className="border border-cream-dark rounded-lg max-h-40 overflow-y-auto">
              {filteredVendors.slice(0, 5).map((v) => (
                <button
                  key={v._id}
                  onClick={() => {
                    setInvitedVendorIds((prev) => [...prev, v._id]);
                    setVendorSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-cream dark:hover:bg-navy transition-colors"
                >
                  {v.companyName}
                </button>
              ))}
            </div>
          )}
          {invitedVendorIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {invitedVendorIds.map((id) => {
                const vendor = allVendors?.profiles.find((v) => v._id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 text-xs bg-green/10 text-green font-medium px-2.5 py-1 rounded-full"
                  >
                    {vendor?.companyName ?? "Vendor"}
                    <button
                      onClick={() => setInvitedVendorIds((prev) => prev.filter((i) => i !== id))}
                      className="text-green hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green hover:bg-green-light text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Posting..." : "Post RFQ"}
          </button>
          <Link
            href="/rfq"
            className="border border-cream-dark text-navy hover:bg-cream px-6 py-3 rounded-lg transition-colors text-center font-medium dark:text-gray-300 dark:border-navy-light dark:hover:bg-navy"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
