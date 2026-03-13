import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const submitReview = mutation({
  args: {
    reviewerId: v.id("users"),
    vendorId: v.id("users"),
    rfqId: v.optional(v.id("rfqs")),
    projectName: v.optional(v.string()),
    serviceType: v.string(),
    ratings: v.object({
      qualityOfWork: v.number(),
      communication: v.number(),
      timeliness: v.number(),
      complianceKnowledge: v.number(),
      value: v.number(),
    }),
    notes: v.optional(v.string()),
    serviceCompletedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || reviewer.role !== "facility_manager") {
      throw new Error("Only facility managers can submit reviews");
    }

    const ratingValues = Object.values(args.ratings);
    if (ratingValues.some((r) => r < 1 || r > 5 || !Number.isInteger(r))) {
      throw new Error("Ratings must be integers between 1 and 5");
    }

    if (!args.rfqId && !args.projectName?.trim()) {
      throw new Error("Either an RFQ or project name is required");
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId_reviewerId", (q) =>
        q.eq("vendorId", args.vendorId).eq("reviewerId", args.reviewerId)
      )
      .collect();

    if (args.rfqId) {
      const duplicate = existing.find((r) => r.rfqId === args.rfqId);
      if (duplicate) throw new Error("You have already reviewed this vendor for this RFQ");
    } else {
      const endorsementReview = existing.find((r) => !r.rfqId);
      if (endorsementReview) throw new Error("You have already submitted a project review for this vendor");
    }

    const overallRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;
    const now = Date.now();

    return await ctx.db.insert("reviews", {
      reviewerId: args.reviewerId,
      vendorId: args.vendorId,
      rfqId: args.rfqId,
      projectName: args.projectName?.trim() || undefined,
      serviceType: args.serviceType,
      ratings: args.ratings,
      overallRating: Math.round(overallRating * 10) / 10,
      notes: args.notes?.trim() || undefined,
      serviceCompletedDate: args.serviceCompletedDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});
