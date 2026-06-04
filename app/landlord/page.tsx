"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { RoleGuard } from "@/components/role-guard";
import { formatDate, formatMoney } from "@/lib/format";

export default function LandlordDashboardPage() {
  return (
    <RoleGuard role="landlord">
      <LandlordDashboard />
    </RoleGuard>
  );
}

function LandlordDashboard() {
  const { address } = useAccount();
  const requests = useQuery(
    api.requests.listForLandlord,
    address ? { landlordAddress: address.toLowerCase() } : "skip"
  );

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="Landlord"
        title="Verification requests"
        description="Define your eligibility rules once. Send a link. See clean pass/fail outcomes — no sensitive data, no liability."
        action={
          <Link href="/landlord/requests/new">
            <Button>New request</Button>
          </Link>
        }
      />

      {requests === undefined ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              <div className="h-16 rounded-md bg-ink-50 animate-pulse" />
              <div className="h-16 rounded-md bg-ink-50 animate-pulse" />
            </div>
          </CardBody>
        </Card>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No verification requests yet"
          description="Create your first request — set the rent, credit, and employment thresholds, then share the link with applicants."
          action={
            <Link href="/landlord/requests/new">
              <Button>Create a request</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {requests.map((r: any) => (
            <Link key={r._id} href={`/landlord/requests/${r._id}`}>
              <Card className="hover:border-ink-300 transition-colors">
                <CardBody className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-ink-900">{r.title}</div>
                    {r.propertyLabel ? (
                      <div className="text-xs text-ink-500 mt-0.5">
                        {r.propertyLabel}
                      </div>
                    ) : null}
                    <div className="text-xs text-ink-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Rent {formatMoney(r.monthlyRent)}/mo</span>
                      <span>{r.salaryMultiplier}× income</span>
                      <span>{r.minCreditScore}+ credit</span>
                      <span>{r.minEmploymentMonths}+ mo employed</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-ink-500">Results</div>
                      <div className="text-sm font-medium text-ink-900">
                        {r.eligibleCount} / {r.totalResults} eligible
                      </div>
                    </div>
                    <Badge tone="neutral">{formatDate(r.createdAt)}</Badge>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
