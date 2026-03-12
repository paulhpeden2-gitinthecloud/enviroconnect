import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createRfq = mutation({
  args: {
    facilityManagerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    services: v.array(v.string()),
    serviceArea: v.string(),
    budgetRange: v.optional(v.string()),
    deadline: v.number(),
    timeline: v.string(),
    requirements: v.optional(v.string()),
    invitedVendors: v.optional(v.array(v.id("vendorProfiles"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.facilityManagerId);
    if (!user || user.role !== "facility_manager") throw new Error("Unauthorized");

    const now = Date.now();
    const rfqId = await ctx.db.insert("rfqs", {
      ...args,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    const allProfiles = await ctx.db
      .query("vendorProfiles")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    const matchedVendorUserIds = new Set<string>();

    for (const profile of allProfiles) {
      const serviceMatch = args.services.some((s) => profile.services.includes(s));
      const isInvited = args.invitedVendors?.includes(profile._id) ?? false;

      if (isInvited) {
        await ctx.db.insert("notifications", {
          userId: profile.userId,
          type: "rfq_invite",
          rfqId,
          message: `You've been invited to respond to: "${args.title}"`,
          isRead: false,
          createdAt: now,
        });
        matchedVendorUserIds.add(profile.userId);
      } else if (serviceMatch) {
        await ctx.db.insert("notifications", {
          userId: profile.userId,
          type: "rfq_match",
          rfqId,
          message: `New RFQ matches your services: "${args.title}"`,
          isRead: false,
          createdAt: now,
        });
        matchedVendorUserIds.add(profile.userId);
      }
    }

    return rfqId;
  },
});

export const closeRfq = mutation({
  args: { rfqId: v.id("rfqs"), facilityManagerId: v.id("users") },
  handler: async (ctx, args) => {
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq || rfq.facilityManagerId !== args.facilityManagerId) throw new Error("Unauthorized");
    if (rfq.status !== "open") throw new Error("RFQ is not open");
    await ctx.db.patch(args.rfqId, { status: "closed", updatedAt: Date.now() });
  },
});

export const submitProposal = mutation({
  args: {
    rfqId: v.id("rfqs"),
    vendorProfileId: v.id("vendorProfiles"),
    proposalText: v.string(),
    estimatedCost: v.optional(v.string()),
    estimatedTimeline: v.optional(v.string()),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      fileName: v.string(),
      fileSize: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq || rfq.status !== "open") throw new Error("RFQ is not accepting proposals");

    const profile = await ctx.db.get(args.vendorProfileId);
    if (!profile || !profile.isPublished) throw new Error("Vendor profile not found");

    const existing = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId_vendorProfileId", (q) =>
        q.eq("rfqId", args.rfqId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    if (existing) throw new Error("You have already responded to this RFQ");

    const now = Date.now();
    await ctx.db.insert("rfqResponses", {
      rfqId: args.rfqId,
      vendorProfileId: args.vendorProfileId,
      proposalText: args.proposalText,
      estimatedCost: args.estimatedCost,
      estimatedTimeline: args.estimatedTimeline,
      attachments: args.attachments,
      status: "submitted",
      createdAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: rfq.facilityManagerId,
      type: "rfq_response",
      rfqId: args.rfqId,
      message: `${profile.companyName} submitted a proposal for "${rfq.title}"`,
      isRead: false,
      createdAt: now,
    });
  },
});

export const acceptProposal = mutation({
  args: {
    responseId: v.id("rfqResponses"),
    facilityManagerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) throw new Error("Response not found");

    const rfq = await ctx.db.get(response.rfqId);
    if (!rfq || rfq.facilityManagerId !== args.facilityManagerId) throw new Error("Unauthorized");

    const now = Date.now();

    await ctx.db.patch(args.responseId, { status: "accepted" });

    const otherResponses = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId", (q) => q.eq("rfqId", response.rfqId))
      .collect();
    for (const other of otherResponses) {
      if (other._id !== args.responseId && other.status === "submitted") {
        await ctx.db.patch(other._id, { status: "declined" });
      }
    }

    await ctx.db.patch(response.rfqId, { status: "awarded", updatedAt: now });

    const profile = await ctx.db.get(response.vendorProfileId);
    if (profile) {
      await ctx.db.insert("notifications", {
        userId: profile.userId,
        type: "rfq_accepted",
        rfqId: response.rfqId,
        message: `Your proposal for "${rfq.title}" has been accepted!`,
        isRead: false,
        createdAt: now,
      });
    }
  },
});

export const declineProposal = mutation({
  args: {
    responseId: v.id("rfqResponses"),
    facilityManagerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) throw new Error("Response not found");

    const rfq = await ctx.db.get(response.rfqId);
    if (!rfq || rfq.facilityManagerId !== args.facilityManagerId) throw new Error("Unauthorized");

    await ctx.db.patch(args.responseId, { status: "declined" });
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllNotificationsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
