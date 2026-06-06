/** E2E / TestSprite automation helpers — never enabled in production builds. */

export const E2E_TENANT_ADDRESS =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;

export const E2E_LANDLORD_ADDRESS =
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

/** Unused in seed — fresh landlord onboarding (TC003, TC009). */
export const E2E_FRESH_LANDLORD_ADDRESS =
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as const;

/** Unused in seed — fresh tenant profile wizard (TC014). */
export const E2E_FRESH_TENANT_ADDRESS =
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as const;

export const E2E_DEMO_SLUG = "demo";
export const E2E_ABC_SLUG = "abc123";

export type E2ERole = "tenant" | "landlord";

export function isE2EMode(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_E2E_MODE === "true"
  );
}

export function e2eAddressForRole(role: E2ERole): `0x${string}` {
  return role === "tenant" ? E2E_TENANT_ADDRESS : E2E_LANDLORD_ADDRESS;
}
