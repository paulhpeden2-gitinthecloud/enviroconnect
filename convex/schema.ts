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
      v.literal("rfq_accepted"),
      v.literal("meeting_request"),
      v.literal("meeting_counterproposal"),
      v.literal("meeting_confirmed"),
      v.literal("meeting_declined")
    ),
    rfqId: v.optional(v.id("rfqs")),
    meetingRequestId: v.optional(v.id("meetingRequests")),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    title: v.optional(v.string()),
    rfqId: v.optional(v.id("rfqs")),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_lastMessageAt", ["lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
          fileSize: v.number(),
        })
      )
    ),
    readBy: v.array(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"]),

  meetingRequests: defineTable({
    requesterId: v.id("users"),
    recipientId: v.id("users"),
    subject: v.string(),
    note: v.optional(v.string()),
    meetingType: v.union(v.literal("phone"), v.literal("video"), v.literal("in_person")),
    locationDetail: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    rfqId: v.optional(v.id("rfqs")),
    proposedSlots: v.array(v.object({
      date: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    })),
    counterSlots: v.optional(v.array(v.object({
      date: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    }))),
    confirmedSlot: v.optional(v.object({
      date: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    })),
    status: v.union(
      v.literal("pending"),
      v.literal("counterproposed"),
      v.literal("confirmed"),
      v.literal("declined"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_requesterId", ["requesterId"])
    .index("by_recipientId", ["recipientId"])
    .index("by_status", ["status"]),
});
