"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { RoleGuard } from "@/components/role-guard";
import { ApplicantStatusBadge } from "@/components/landlord/shared";
import { formatAddress, formatDate } from "@/lib/format";
import { propertyDisplayInfo } from "@/lib/property-display";
import { LandlordProperty } from "@/lib/landlord-property";
import { PRIMARY_CARD_CLASS } from "@/lib/ui-classes";

type ResultRow = {
  _id: string;
  tenantAddress: string;
  overallEligible: boolean;
  evaluatedAt: number;
  propertyName: string;
};

export default function LandlordResultsPage() {
  return (
    <RoleGuard role="landlord">
      <LandlordResults />
    </RoleGuard>
  );
}

function LandlordResults() {
  const { address } = useAccount();
  const properties = useQuery(
    api.requests.listForLandlord,
    address ? { landlordAddress: address.toLowerCase() } : "skip"
  );

  const list = (properties ?? []) as LandlordProperty[];

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="Landlord"
        title="Results"
        description="Applicant outcomes across all properties."
        action={
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm">
              ← Properties
            </Button>
          </Link>
        }
      />

      {properties === undefined ? (
        <div className="h-32 rounded-md bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
      ) : (
        <ResultsAggregator properties={list} hasProperties={list.length > 0} />
      )}
    </Container>
  );
}

function ResultsAggregator({
  properties,
  hasProperties,
}: {
  properties: LandlordProperty[];
  hasProperties: boolean;
}) {
  const [sliceMap, setSliceMap] = useState<Record<string, ResultRow[] | null>>(
    {}
  );

  const handleSlice = useCallback((id: string, items: ResultRow[]) => {
    setSliceMap((prev) => ({ ...prev, [id]: items }));
  }, []);

  const propertyIds = properties.map((p) => p._id).join(",");

  useEffect(() => {
    setSliceMap({});
  }, [propertyIds]);

  const allLoaded = properties.every((p) => sliceMap[p._id] !== undefined);

  const sortedRows = useMemo(() => {
    return Object.values(sliceMap)
      .flatMap((rows) => rows ?? [])
      .sort((a, b) => b.evaluatedAt - a.evaluatedAt);
  }, [sliceMap]);

  return (
    <>
      {properties.map((property) => (
        <PropertyResultsSlice
          key={property._id}
          property={property}
          onSlice={handleSlice}
        />
      ))}

      <Card className={PRIMARY_CARD_CLASS}>
        <CardHeader>
          <CardTitle>Applicant results</CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          {!hasProperties ? (
            <EmptyState
              title="No results yet"
              description="Applicant verification outcomes will appear here once tenants complete verification."
            />
          ) : !allLoaded ? (
            <div className="h-12 rounded-md bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
          ) : sortedRows.length === 0 ? (
            <EmptyState
              title="No results yet"
              description="Share your verification links. Outcomes appear here as applicants complete screening."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100/60 text-xs font-medium uppercase tracking-[0.1em] text-ink-500 dark:border-white/[0.06] dark:text-white/45">
                    <th className="pb-3 pr-4 font-medium">Wallet</th>
                    <th className="pb-3 pr-4 font-medium">Property</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Submitted</th>
                    <th className="pb-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/40 dark:divide-white/[0.06]">
                  {sortedRows.map((r) => (
                    <tr key={r._id}>
                      <td className="py-3.5 pr-4 font-mono text-ink-900 dark:text-white/90">
                        {formatAddress(r.tenantAddress)}
                      </td>
                      <td className="py-3.5 pr-4 text-ink-700 dark:text-white/70">
                        {r.propertyName}
                      </td>
                      <td className="py-3.5 pr-4">
                        <ApplicantStatusBadge eligible={r.overallEligible} />
                      </td>
                      <td className="py-3.5 pr-4 text-ink-500 dark:text-white/45">
                        {formatDate(r.evaluatedAt)}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link href={`/results/${r._id}`}>
                          <Button size="sm" variant="secondary">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}

function PropertyResultsSlice({
  property,
  onSlice,
}: {
  property: LandlordProperty;
  onSlice: (id: string, items: ResultRow[]) => void;
}) {
  const results = useQuery(api.results.listForRequest, {
    requestId: property._id as Id<"requests">,
  });

  const propertyName = propertyDisplayInfo(property, "Property").name;

  useEffect(() => {
    if (results === undefined) return;
    onSlice(
      property._id,
      results.map((r) => ({
        _id: r._id,
        tenantAddress: r.tenantAddress,
        overallEligible: r.overallEligible,
        evaluatedAt: r.evaluatedAt,
        propertyName,
      }))
    );
  }, [results, propertyName, onSlice, property._id]);

  return null;
}
