import { query } from "../_generated/server";
import { v } from "convex/values";

export const getVendorReviews = query({
  args: { vendorId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
      .collect();

    const enriched = await Promise.all(
      reviews.map(async (r) => {
        const reviewer = await ctx.db.get(r.reviewerId);
        return { ...r, reviewerName: reviewer?.name ?? "Unknown", reviewerCompany: reviewer?.company ?? "" };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getVendorRatingSummary = query({
  args: { vendorId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
      .collect();

    if (reviews.length === 0) return null;

    const count = reviews.length;
    const sum = {
      qualityOfWork: 0,
      communication: 0,
      timeliness: 0,
      complianceKnowledge: 0,
      value: 0,
      overall: 0,
    };

    for (const r of reviews) {
      sum.qualityOfWork += r.ratings.qualityOfWork;
      sum.communication += r.ratings.communication;
      sum.timeliness += r.ratings.timeliness;
      sum.complianceKnowledge += r.ratings.complianceKnowledge;
      sum.value += r.ratings.value;
      sum.overall += r.overallRating;
    }

    return {
      count,
      overall: sum.overall / count,
      categories: {
        qualityOfWork: sum.qualityOfWork / count,
        communication: sum.communication / count,
        timeliness: sum.timeliness / count,
        complianceKnowledge: sum.complianceKnowledge / count,
        value: sum.value / count,
      },
    };
  },
});

export const getVendorRatingSummaryBatch = query({
  args: { vendorIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const results: Record<string, { overall: number; count: number }> = {};

    for (const vendorId of args.vendorIds) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_vendorId", (q) => q.eq("vendorId", vendorId))
        .collect();

      if (reviews.length > 0) {
        const overall = reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length;
        results[vendorId] = { overall, count: reviews.length };
      }
    }

    return results;
  },
});

export const canReviewVendor = query({
  args: {
    reviewerId: v.id("users"),
    vendorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || reviewer.role !== "facility_manager") return { canReview: false as const, reason: "Only facility managers can leave reviews" };

    const existingReviews = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId_reviewerId", (q) =>
        q.eq("vendorId", args.vendorId).eq("reviewerId", args.reviewerId)
      )
      .collect();

    const vendorProfiles = await ctx.db
      .query("vendorProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.vendorId))
      .collect();
    const vendorProfile = vendorProfiles[0];

    const reviewerRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_facilityManagerId", (q) => q.eq("facilityManagerId", args.reviewerId))
      .collect();

    const reviewableRfqs: Array<{ rfqId: string; title: string }> = [];
    if (vendorProfile) {
      for (const rfq of reviewerRfqs) {
        const responses = await ctx.db
          .query("rfqResponses")
          .withIndex("by_rfqId_vendorProfileId", (q) =>
            q.eq("rfqId", rfq._id).eq("vendorProfileId", vendorProfile._id)
          )
          .collect();
        const accepted = responses.find((r) => r.status === "accepted");
        if (accepted) {
          const alreadyReviewed = existingReviews.find((er) => er.rfqId === rfq._id);
          if (!alreadyReviewed) {
            reviewableRfqs.push({ rfqId: rfq._id, title: rfq.title });
          }
        }
      }
    }

    let hasEndorsement = false;
    let hasEndorsementReview = false;
    if (vendorProfile) {
      const endorsement = await ctx.db
        .query("vendorEndorsements")
        .withIndex("by_endorserId_vendorProfileId", (q) =>
          q.eq("endorserId", args.reviewerId).eq("vendorProfileId", vendorProfile._id)
        )
        .first();
      hasEndorsement = !!endorsement;
      hasEndorsementReview = existingReviews.some((r) => !r.rfqId);
    }

    const canViaRfq = reviewableRfqs.length > 0;
    const canViaEndorsement = hasEndorsement && !hasEndorsementReview;

    if (!canViaRfq && !canViaEndorsement) {
      return { canReview: false as const, reason: "You need an accepted RFQ proposal or endorsement to review this vendor" };
    }

    return {
      canReview: true as const,
      reviewableRfqs,
      canViaEndorsement,
    };
  },
});
