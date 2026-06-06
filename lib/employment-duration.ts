import { formatMonths } from "@/lib/format";

/** Tenant-selected duration buckets (representative months for encryption). */
export const TENANT_EMPLOYMENT_OPTIONS = [
  { label: "Less than 6 months", months: 3 },
  { label: "6–12 months", months: 9 },
  { label: "1–2 years", months: 18 },
  { label: "2–5 years", months: 42 },
  { label: "5+ years", months: 72 },
] as const;

/** Landlord minimum acceptable duration (stored as minMonths threshold). */
export const LANDLORD_MIN_EMPLOYMENT_OPTIONS = [
  { label: "6–12 months", minMonths: 6 },
  { label: "1–2 years", minMonths: 12 },
  { label: "2–5 years", minMonths: 24 },
  { label: "5+ years", minMonths: 60 },
] as const;

export type LandlordMinEmploymentMonths =
  (typeof LANDLORD_MIN_EMPLOYMENT_OPTIONS)[number]["minMonths"];

export function employmentRequirementLabel(minMonths: number): string {
  const match = LANDLORD_MIN_EMPLOYMENT_OPTIONS.find(
    (o) => o.minMonths === minMonths
  );
  if (match) return match.label;

  const tenantMatch = TENANT_EMPLOYMENT_OPTIONS.find(
    (o) => o.months === minMonths
  );
  if (tenantMatch && tenantMatch.label !== "Less than 6 months") {
    return tenantMatch.label;
  }

  return formatMonths(minMonths);
}

export function formatEmploymentRequirement(minMonths: number): string {
  return `≥ ${employmentRequirementLabel(minMonths)}`;
}
