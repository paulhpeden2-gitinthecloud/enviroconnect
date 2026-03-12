import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const toggleEndorsement = mutation({
  args: {
    endorserId: v.id("users"),
    vendorProfileId: v.id("vendorProfiles"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate endorser exists and get their role
    const endorser = await ctx.db.get(args.endorserId);
    if (!endorser) throw new Error("User not found");

    // Get the vendor profile to check ownership
    const vendorProfile = await ctx.db.get(args.vendorProfileId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    // Can't endorse yourself
    if (vendorProfile.userId === args.endorserId) {
      throw new Error("You cannot endorse yourself");
    }

    // Check if already endorsed
    const existing = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_endorserId_vendorProfileId", (q) =>
        q
          .eq("endorserId", args.endorserId)
          .eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();

    if (existing) {
      // Un-endorse
      await ctx.db.delete(existing._id);
      return { action: "removed" as const };
    }

    // Check endorsement cap (250 per user)
    const myEndorsements = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_endorserId", (q) => q.eq("endorserId", args.endorserId))
      .collect();

    if (myEndorsements.length >= 250) {
      throw new Error("You have reached the maximum number of endorsements (250)");
    }

    // Determine type based on role
    const type = endorser.role === "vendor" ? "peer" : "client";

    // Truncate note to 200 chars
    const note = args.note?.trim().slice(0, 200) || undefined;

    await ctx.db.insert("vendorEndorsements", {
      endorserId: args.endorserId,
      vendorProfileId: args.vendorProfileId,
      type,
      note,
      createdAt: Date.now(),
    });

    return { action: "added" as const };
  },
});
