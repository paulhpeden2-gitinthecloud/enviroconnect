"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { SERVICE_TYPES, SERVICE_AREAS, CERTIFICATIONS } from "@/lib/constants";

type Props = { profile: Doc<"vendorProfiles">; userId: Id<"users"> };

export function ProfileForm({ profile, userId }: Props) {
  const updateProfile = useMutation(api.mutations.updateVendorProfile);
  const [form, setForm] = useState({
    companyName: profile.companyName,
    description: profile.description,
    email: profile.email,
    phone: profile.phone ?? "",
    website: profile.website ?? "",
    city: profile.city,
    state: profile.state,
    services: profile.services,
    certifications: profile.certifications,
    serviceArea: profile.serviceArea,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (
    field: "services" | "certifications" | "serviceArea",
    value: string
  ) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateProfile({ id: profile._id, userId, ...form });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const textFields = [
    { label: "Company Name", key: "companyName", type: "text" },
    { label: "Email", key: "email", type: "email" },
    { label: "Phone", key: "phone", type: "tel" },
    { label: "Website", key: "website", type: "url" },
    { label: "City", key: "city", type: "text" },
    { label: "State", key: "state", type: "text" },
  ];

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-navy">Basic Information</h2>
        {textFields.map(({ label, key, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[key as keyof typeof form] as string}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description{" "}
            <span className="text-gray-400 text-xs">(max 2000 chars)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value.slice(0, 2000),
              }))
            }
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
          />
          <p className="text-xs text-gray-400 text-right">
            {form.description.length}/2000
          </p>
        </div>
      </section>

      {(
        [
          {
            title: "Services",
            field: "services" as const,
            options: SERVICE_TYPES as unknown as string[],
          },
          {
            title: "Certifications",
            field: "certifications" as const,
            options: CERTIFICATIONS as unknown as string[],
          },
          {
            title: "Service Areas",
            field: "serviceArea" as const,
            options: SERVICE_AREAS as unknown as string[],
          },
        ] as const
      ).map(({ title, field, options }) => (
        <section
          key={field}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-navy mb-4">{title}</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[field].includes(opt)}
                  onChange={() => toggle(field, opt)}
                  className="accent-green"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy hover:bg-navy-light text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && <span className="text-green text-sm">Saved!</span>}
      </div>
    </div>
  );
}
