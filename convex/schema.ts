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
});
