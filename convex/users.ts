import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .unique();
  },
});

export const setRole = mutation({
  args: {
    walletAddress: v.string(),
    role: v.union(v.literal("tenant"), v.literal("landlord")),
  },
  handler: async (ctx, { walletAddress, role }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .unique();

    const now = Date.now();
    if (existing) {
      if (existing.role !== role) {
        throw new Error(
          `This wallet is already registered as a ${existing.role}. Roles are locked.`
        );
      }
      await ctx.db.patch(existing._id, { lastSeenAt: now });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      walletAddress,
      role,
      createdAt: now,
      lastSeenAt: now,
    });
  },
});

export const touch = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: Date.now() });
    }
  },
});
