import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    landlordAddress: v.string(),
    title: v.string(),
    propertyLabel: v.optional(v.string()),
    monthlyRent: v.number(),
    salaryMultiplier: v.number(),
    minCreditScore: v.number(),
    minEmploymentMonths: v.number(),
    shareSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.landlordAddress)
      )
      .unique();
    if (!user) {
      throw new Error("Wallet not registered. Complete onboarding first.");
    }
    if (user.role !== "landlord") {
      throw new Error("Only landlords can create verification requests.");
    }
    if (args.monthlyRent <= 0) throw new Error("Monthly rent must be > 0.");
    if (args.salaryMultiplier <= 0)
      throw new Error("Salary multiplier must be > 0.");
    if (args.minCreditScore < 0 || args.minCreditScore > 850)
      throw new Error("Credit score must be 0..850.");
    if (args.minEmploymentMonths < 0)
      throw new Error("Employment months must be >= 0.");

    return await ctx.db.insert("requests", {
      landlordAddress: args.landlordAddress,
      title: args.title,
      propertyLabel: args.propertyLabel,
      monthlyRent: args.monthlyRent,
      salaryMultiplier: args.salaryMultiplier,
      minCreditScore: args.minCreditScore,
      minEmploymentMonths: args.minEmploymentMonths,
      shareSlug: args.shareSlug,
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("requests") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("requests")
      .withIndex("by_slug", (q) => q.eq("shareSlug", slug))
      .unique();
  },
});

export const listForLandlord = query({
  args: { landlordAddress: v.string() },
  handler: async (ctx, { landlordAddress }) => {
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_landlord", (q) =>
        q.eq("landlordAddress", landlordAddress)
      )
      .order("desc")
      .collect();

    return await Promise.all(
      requests.map(async (r) => {
        const results = await ctx.db
          .query("results")
          .withIndex("by_request", (q) => q.eq("requestId", r._id))
          .collect();
        return {
          ...r,
          totalResults: results.length,
          eligibleCount: results.filter((x) => x.overallEligible).length,
        };
      })
    );
  },
});
