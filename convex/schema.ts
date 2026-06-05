import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    walletAddress: v.string(),
    role: v.union(v.literal("tenant"), v.literal("landlord")),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_wallet", ["walletAddress"]),

  profiles: defineTable({
    walletAddress: v.string(),
    encSalary: v.string(),
    encCreditScore: v.string(),
    encEmploymentMonths: v.string(),
    salaryCurrency: v.optional(
      v.union(v.literal("INR"), v.literal("USD"))
    ),
    onChainTxHash: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_wallet", ["walletAddress"]),

  requests: defineTable({
    landlordAddress: v.string(),
    title: v.string(),
    propertyLabel: v.optional(v.string()),
    monthlyRent: v.number(),
    salaryMultiplier: v.number(),
    minCreditScore: v.number(),
    minEmploymentMonths: v.number(),
    shareSlug: v.string(),
    createdAt: v.number(),
  })
    .index("by_landlord", ["landlordAddress"])
    .index("by_slug", ["shareSlug"]),

  results: defineTable({
    requestId: v.id("requests"),
    tenantAddress: v.string(),
    passSalary: v.boolean(),
    passCredit: v.boolean(),
    passEmployment: v.boolean(),
    overallEligible: v.boolean(),
    onChainTxHash: v.optional(v.string()),
    evaluatedAt: v.number(),
  })
    .index("by_request", ["requestId"])
    .index("by_tenant", ["tenantAddress"])
    .index("by_request_tenant", ["requestId", "tenantAddress"]),
});
