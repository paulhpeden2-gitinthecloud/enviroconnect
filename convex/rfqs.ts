import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRfqs = query({
  args: {
    serviceType: v.optional(v.string()),
    region: v.optional(v.string()),
    timeline: v.optional(v.string()),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    if (args.serviceType) rfqs = rfqs.filter((r) => r.services.includes(args.serviceType!));
    if (args.region) rfqs = rfqs.filter((r) => r.serviceArea === args.region!);
    if (args.timeline) rfqs = rfqs.filter((r) => r.timeline === args.timeline!);
    if (args.search) {
      const term = args.search.toLowerCase();
      rfqs = rfqs.filter(
        (r) => r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
      );
    }

    rfqs.sort((a, b) => b.createdAt - a.createdAt);

    const page = args.page ?? 1;
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    return { rfqs: rfqs.slice(start, start + pageSize), total: rfqs.length, page, pageSize };
  },
});

export const getRfq = query({
  args: { id: v.id("rfqs") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getMyRfqs = query({
  args: { facilityManagerId: v.id("users") },
  handler: async (ctx, args) => {
    const rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_facilityManagerId", (q) => q.eq("facilityManagerId", args.facilityManagerId))
      .collect();
    rfqs.sort((a, b) => b.createdAt - a.createdAt);

    const withCounts = await Promise.all(
      rfqs.map(async (rfq) => {
        const responses = await ctx.db
          .query("rfqResponses")
          .withIndex("by_rfqId", (q) => q.eq("rfqId", rfq._id))
          .collect();
        return { ...rfq, responseCount: responses.length };
      })
    );
    return withCounts;
  },
});

export const getRfqResponses = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    const withProfiles = await Promise.all(
      responses.map(async (r) => {
        const profile = await ctx.db.get(r.vendorProfileId);
        return { ...r, vendorProfile: profile };
      })
    );
    return withProfiles;
  },
});

export const getMatchedRfqs = query({
  args: { vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.vendorProfileId);
    if (!profile) return [];

    const openRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const matched = openRfqs.filter((rfq) => {
      const serviceMatch = rfq.services.some((s) => profile.services.includes(s));
      const invited = rfq.invitedVendors?.includes(args.vendorProfileId) ?? false;
      return serviceMatch || invited;
    });

    return matched
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((rfq) => ({
        ...rfq,
        isInvited: rfq.invitedVendors?.includes(args.vendorProfileId) ?? false,
        isServiceMatch: rfq.services.some((s) => profile.services.includes(s)),
      }));
  },
});

export const hasVendorResponded = query({
  args: { rfqId: v.id("rfqs"), vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId_vendorProfileId", (q) =>
        q.eq("rfqId", args.rfqId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    return existing !== null;
  },
});

export const getVendorResponses = query({
  args: { vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("rfqResponses")
      .withIndex("by_vendorProfileId", (q) => q.eq("vendorProfileId", args.vendorProfileId))
      .collect();

    const withRfqs = await Promise.all(
      responses.map(async (r) => {
        const rfq = await ctx.db.get(r.rfqId);
        return { ...r, rfq };
      })
    );
    return withRfqs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUnreadNotificationCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    return unread.length;
  },
});
