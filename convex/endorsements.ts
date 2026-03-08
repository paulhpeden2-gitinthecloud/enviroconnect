import { query } from "./_generated/server";
import { v } from "convex/values";

export const getEndorsementCounts = query({
  args: { vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const endorsements = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_vendorProfileId", (q) =>
        q.eq("vendorProfileId", args.vendorProfileId)
      )
      .collect();

    let peerCount = 0;
    let clientCount = 0;
    for (const e of endorsements) {
      if (e.type === "peer") peerCount++;
      else clientCount++;
    }
    return { peerCount, clientCount };
  },
});

export const getEndorsementCountsBatch = query({
  args: { vendorProfileIds: v.array(v.id("vendorProfiles")) },
  handler: async (ctx, args) => {
    const result: Record<string, { peerCount: number; clientCount: number }> = {};

    for (const vpId of args.vendorProfileIds) {
      const endorsements = await ctx.db
        .query("vendorEndorsements")
        .withIndex("by_vendorProfileId", (q) => q.eq("vendorProfileId", vpId))
        .collect();

      let peerCount = 0;
      let clientCount = 0;
      for (const e of endorsements) {
        if (e.type === "peer") peerCount++;
        else clientCount++;
      }
      result[vpId] = { peerCount, clientCount };
    }
    return result;
  },
});

export const getEndorsers = query({
  args: {
    vendorProfileId: v.id("vendorProfiles"),
    type: v.optional(v.union(v.literal("peer"), v.literal("client"))),
  },
  handler: async (ctx, args) => {
    const endorsements = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_vendorProfileId", (q) =>
        q.eq("vendorProfileId", args.vendorProfileId)
      )
      .collect();

    const filtered = args.type
      ? endorsements.filter((e) => e.type === args.type)
      : endorsements;

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const withUsers = await Promise.all(
      filtered.map(async (e) => {
        const user = await ctx.db.get(e.endorserId);
        return {
          _id: e._id,
          endorserName: user?.name ?? "Unknown",
          endorserCompany: user?.company ?? "",
          type: e.type,
          note: e.note,
          createdAt: e.createdAt,
        };
      })
    );
    return withUsers;
  },
});

export const hasEndorsed = query({
  args: {
    endorserId: v.id("users"),
    vendorProfileId: v.id("vendorProfiles"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_endorserId_vendorProfileId", (q) =>
        q
          .eq("endorserId", args.endorserId)
          .eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    return existing !== null;
  },
});
