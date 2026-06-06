import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

const TENANT = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const LANDLORD = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const FRESH_TENANT = "0x90f79bf6eb2c4f870365e785982e1f101e93b906";
const FRESH_LANDLORD = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";

async function clearWalletFixtures(ctx: MutationCtx, walletAddress: string) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .unique();
  if (profile) {
    await ctx.db.delete(profile._id);
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .unique();
  if (user) {
    await ctx.db.delete(user._id);
  }
}

async function upsertUser(
  ctx: MutationCtx,
  walletAddress: string,
  role: "tenant" | "landlord"
) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .unique();
  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { lastSeenAt: now });
    return existing._id;
  }
  return await ctx.db.insert("users", {
    walletAddress,
    role,
    createdAt: now,
    lastSeenAt: now,
  });
}

async function upsertRequestBySlug(
  ctx: MutationCtx,
  shareSlug: string
) {
  const existing = await ctx.db
    .query("requests")
    .withIndex("by_slug", (q) => q.eq("shareSlug", shareSlug))
    .unique();

  const fields = {
    landlordAddress: LANDLORD,
    title: "Demo Property",
    propertyLabel: "Unit 4B",
    monthlyRent: 50000,
    rentCurrency: "INR" as const,
    salaryMultiplier: 3,
    minCreditScore: 650,
    minEmploymentMonths: 12,
    shareSlug,
    createdAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, fields);
    return existing._id;
  }
  return await ctx.db.insert("requests", fields);
}

export const getE2EFixtures = query({
  args: {},
  handler: async (ctx) => {
    const demoRequest = await ctx.db
      .query("requests")
      .withIndex("by_slug", (q) => q.eq("shareSlug", "demo"))
      .unique();
    const demoResult = demoRequest
      ? await ctx.db
          .query("results")
          .withIndex("by_request", (q) => q.eq("requestId", demoRequest._id))
          .first()
      : null;

    return {
      tenantAddress: TENANT,
      landlordAddress: LANDLORD,
      demoSlug: "demo",
      abcSlug: "abc123",
      verifyDemoUrl: "/verify/demo",
      verifyAbcUrl: "/verify/abc123",
      resultDemoUrl: demoResult ? `/results/${demoResult._id}` : null,
      resultAliasUrl: "/results/demo",
    };
  },
});

export const seedE2EFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await clearWalletFixtures(ctx, FRESH_TENANT);
    await clearWalletFixtures(ctx, FRESH_LANDLORD);

    await upsertUser(ctx, TENANT, "tenant");
    await upsertUser(ctx, LANDLORD, "landlord");

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", TENANT))
      .unique();

    if (!existingProfile) {
      await ctx.db.insert("profiles", {
        walletAddress: TENANT,
        encSalary: "e2e:salary",
        encCreditScore: "e2e:credit",
        encEmploymentMonths: "e2e:employment",
        salaryCurrency: "INR",
        updatedAt: Date.now(),
      });
    }

    const demoRequestId = await upsertRequestBySlug(ctx, "demo");
    await upsertRequestBySlug(ctx, "abc123");
    await upsertRequestBySlug(ctx, "sample-share");

    const existingResult = await ctx.db
      .query("results")
      .withIndex("by_request_tenant", (q) =>
        q.eq("requestId", demoRequestId).eq("tenantAddress", TENANT)
      )
      .unique();

    let resultId = existingResult?._id;
    if (!resultId) {
      resultId = await ctx.db.insert("results", {
        requestId: demoRequestId,
        tenantAddress: TENANT,
        passSalary: true,
        passCredit: true,
        passEmployment: true,
        overallEligible: true,
        onChainTxHash: `0x${"ab".repeat(32)}`,
        evaluatedAt: Date.now(),
      });
    }

    return {
      tenantAddress: TENANT,
      landlordAddress: LANDLORD,
      demoRequestId,
      resultId,
      verifyDemoUrl: "/verify/demo",
      verifyAbcUrl: "/verify/abc123",
      resultUrl: `/results/${resultId}`,
    };
  },
});
