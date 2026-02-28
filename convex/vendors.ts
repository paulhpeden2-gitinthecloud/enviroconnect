import { query } from "./_generated/server";
import { v } from "convex/values";

export const getVendorProfiles = query({
  args: {
    serviceType: v.optional(v.string()),
    region: v.optional(v.string()),
    certification: v.optional(v.string()),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let profiles = await ctx.db
      .query("vendorProfiles")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    if (args.serviceType) profiles = profiles.filter((p) => p.services.includes(args.serviceType!));
    if (args.region) profiles = profiles.filter((p) => p.serviceArea.includes(args.region!));
    if (args.certification) profiles = profiles.filter((p) => p.certifications.includes(args.certification!));
    if (args.search) {
      const term = args.search.toLowerCase();
      profiles = profiles.filter(
        (p) => p.companyName.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }

    const page = args.page ?? 1;
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    return { profiles: profiles.slice(start, start + pageSize), total: profiles.length, page, pageSize };
  },
});

export const getVendorProfile = query({
  args: { id: v.id("vendorProfiles") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getVendorProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vendorProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getSavedVendors = query({
  args: { facilityManagerId: v.id("users") },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("savedVendors")
      .withIndex("by_facilityManagerId", (q) => q.eq("facilityManagerId", args.facilityManagerId))
      .collect();
    const profiles = await Promise.all(saved.map((s) => ctx.db.get(s.vendorProfileId)));
    return profiles.filter(Boolean);
  },
});

export const isVendorSaved = query({
  args: { facilityManagerId: v.id("users"), vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("savedVendors")
      .withIndex("by_facilityManagerId_vendorProfileId", (q) =>
        q.eq("facilityManagerId", args.facilityManagerId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    return saved !== null;
  },
});
