import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const record = mutation({
  args: {
    requestId: v.id("requests"),
    tenantAddress: v.string(),
    passSalary: v.boolean(),
    passCredit: v.boolean(),
    passEmployment: v.boolean(),
    overallEligible: v.boolean(),
    onChainTxHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.tenantAddress)
      )
      .unique();
    if (!user || user.role !== "tenant") {
      throw new Error("Only tenants can record verification results.");
    }
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");

    const existing = await ctx.db
      .query("results")
      .withIndex("by_request_tenant", (q) =>
        q.eq("requestId", args.requestId).eq("tenantAddress", args.tenantAddress)
      )
      .unique();

    const now = Date.now();
    const fields = {
      requestId: args.requestId,
      tenantAddress: args.tenantAddress,
      passSalary: args.passSalary,
      passCredit: args.passCredit,
      passEmployment: args.passEmployment,
      overallEligible: args.overallEligible,
      onChainTxHash: args.onChainTxHash,
      evaluatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("results", fields);
  },
});

export const get = query({
  args: { id: v.id("results") },
  handler: async (ctx, { id }) => {
    const result = await ctx.db.get(id);
    if (!result) return null;
    const request = await ctx.db.get(result.requestId);
    return { ...result, request };
  },
});

export const listForTenant = query({
  args: { tenantAddress: v.string() },
  handler: async (ctx, { tenantAddress }) => {
    const results = await ctx.db
      .query("results")
      .withIndex("by_tenant", (q) => q.eq("tenantAddress", tenantAddress))
      .order("desc")
      .collect();
    return await Promise.all(
      results.map(async (r) => {
        const request = await ctx.db.get(r.requestId);
        return { ...r, request };
      })
    );
  },
});

export const listForRequest = query({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    return await ctx.db
      .query("results")
      .withIndex("by_request", (q) => q.eq("requestId", requestId))
      .order("desc")
      .collect();
  },
});

export const findExisting = query({
  args: {
    requestId: v.id("requests"),
    tenantAddress: v.string(),
  },
  handler: async (ctx, { requestId, tenantAddress }) => {
    return await ctx.db
      .query("results")
      .withIndex("by_request_tenant", (q) =>
        q.eq("requestId", requestId).eq("tenantAddress", tenantAddress)
      )
      .unique();
  },
});
