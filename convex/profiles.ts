import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    walletAddress: v.string(),
    encSalary: v.string(),
    encCreditScore: v.string(),
    encEmploymentMonths: v.string(),
    onChainTxHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.walletAddress)
      )
      .unique();
    if (!user) {
      throw new Error("Wallet not registered. Complete onboarding first.");
    }
    if (user.role !== "tenant") {
      throw new Error("Only tenants can create profiles.");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.walletAddress)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        encSalary: args.encSalary,
        encCreditScore: args.encCreditScore,
        encEmploymentMonths: args.encEmploymentMonths,
        onChainTxHash: args.onChainTxHash,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("profiles", {
      walletAddress: args.walletAddress,
      encSalary: args.encSalary,
      encCreditScore: args.encCreditScore,
      encEmploymentMonths: args.encEmploymentMonths,
      onChainTxHash: args.onChainTxHash,
      updatedAt: now,
    });
  },
});
