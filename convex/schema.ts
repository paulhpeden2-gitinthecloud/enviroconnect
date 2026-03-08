import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("vendor"), v.literal("facility_manager")),
    company: v.string(),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  vendorProfiles: defineTable({
    userId: v.id("users"),
    companyName: v.string(),
    description: v.string(),
    services: v.array(v.string()),
    certifications: v.array(v.string()),
    serviceArea: v.array(v.string()),
    phone: v.optional(v.string()),
    email: v.string(),
    website: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_isPublished", ["isPublished"]),

  savedVendors: defineTable({
    facilityManagerId: v.id("users"),
    vendorProfileId: v.id("vendorProfiles"),
    savedAt: v.number(),
  })
    .index("by_facilityManagerId", ["facilityManagerId"])
    .index("by_facilityManagerId_vendorProfileId", [
      "facilityManagerId",
      "vendorProfileId",
    ]),

  vendorEndorsements: defineTable({
    endorserId: v.id("users"),
    vendorProfileId: v.id("vendorProfiles"),
    type: v.union(v.literal("peer"), v.literal("client")),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_vendorProfileId", ["vendorProfileId"])
    .index("by_endorserId", ["endorserId"])
    .index("by_endorserId_vendorProfileId", ["endorserId", "vendorProfileId"]),

  rfqs: defineTable({
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
    status: v.union(v.literal("open"), v.literal("closed"), v.literal("awarded")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_facilityManagerId", ["facilityManagerId"])
    .index("by_status", ["status"]),

  rfqResponses: defineTable({
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
    status: v.union(v.literal("submitted"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("by_rfqId", ["rfqId"])
    .index("by_vendorProfileId", ["vendorProfileId"])
    .index("by_rfqId_vendorProfileId", ["rfqId", "vendorProfileId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("rfq_match"),
      v.literal("rfq_invite"),
      v.literal("rfq_response"),
      v.literal("rfq_accepted")
    ),
    rfqId: v.id("rfqs"),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),
});
