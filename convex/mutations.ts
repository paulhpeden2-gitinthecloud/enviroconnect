import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createVendorProfile = mutation({
  args: {
    userId: v.id("users"),
    companyName: v.string(),
    email: v.string(),
    city: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vendorProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("vendorProfiles", {
      ...args,
      description: "",
      services: [],
      certifications: [],
      serviceArea: [],
      isPublished: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateVendorProfile = mutation({
  args: {
    id: v.id("vendorProfiles"),
    userId: v.id("users"),
    companyName: v.optional(v.string()),
    description: v.optional(v.string()),
    services: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
    serviceArea: v.optional(v.array(v.string())),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.id);
    if (!profile || profile.userId !== args.userId) throw new Error("Unauthorized");
    const { id, userId, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(args.id, { ...filtered, updatedAt: Date.now() });
  },
});

export const togglePublishProfile = mutation({
  args: { id: v.id("vendorProfiles"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.id);
    if (!profile || profile.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, { isPublished: !profile.isPublished, updatedAt: Date.now() });
  },
});

export const saveVendor = mutation({
  args: { facilityManagerId: v.id("users"), vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedVendors")
      .withIndex("by_facilityManagerId_vendorProfileId", (q) =>
        q.eq("facilityManagerId", args.facilityManagerId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    if (existing) return;
    await ctx.db.insert("savedVendors", { ...args, savedAt: Date.now() });
  },
});

export const unsaveVendor = mutation({
  args: { facilityManagerId: v.id("users"), vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedVendors")
      .withIndex("by_facilityManagerId_vendorProfileId", (q) =>
        q.eq("facilityManagerId", args.facilityManagerId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
