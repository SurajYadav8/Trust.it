export type LandlordProperty = {
  _id: string;
  shareSlug: string;
  title: string;
  propertyLabel?: string;
  createdAt: number;
  totalResults: number;
  eligibleCount: number;
};

export function propertyShareUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/verify/${slug}`;
  }
  return `/verify/${slug}`;
}

export function aggregateLandlordStats(properties: LandlordProperty[]) {
  const activeProperties = properties.length;
  const totalApplicants = properties.reduce((n, p) => n + p.totalResults, 0);
  const eligibleApplicants = properties.reduce((n, p) => n + p.eligibleCount, 0);
  const failedApplicants = totalApplicants - eligibleApplicants;

  return {
    activeProperties,
    totalApplicants,
    eligibleApplicants,
    pendingApplicants: 0,
    failedApplicants,
  };
}
