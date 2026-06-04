"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { RoleGuard } from "@/components/role-guard";
import { formatDate } from "@/lib/format";

export default function DashboardPage() {
  return (
    <RoleGuard role="tenant">
      <TenantDashboard />
    </RoleGuard>
  );
}

function TenantDashboard() {
  const { address } = useAccount();
  const profile = useQuery(
    api.profiles.get,
    address ? { walletAddress: address.toLowerCase() } : "skip"
  );
  const results = useQuery(
    api.results.listForTenant,
    address ? { tenantAddress: address.toLowerCase() } : "skip"
  );

  const hasProfile = !!profile;

  return (
    <Container className="py-10">
      <PageHeading
        eyebrow="Tenant dashboard"
        title="Your verifications"
        description="One encrypted profile. Every landlord check uses the same source of truth."
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Verification history</CardTitle>
                <CardDescription>
                  Every check you&apos;ve run against a landlord&apos;s request.
                </CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              {results === undefined ? (
                <SkeletonRow />
              ) : results.length === 0 ? (
                <EmptyState
                  title="No verifications yet"
                  description="When a landlord shares a verification link with you, run it here. Results stay tied to your wallet."
                  action={
                    !hasProfile ? (
                      <Link href="/profile">
                        <Button>Create your profile first</Button>
                      </Link>
                    ) : null
                  }
                />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {results.map((r: any) => (
                    <li
                      key={r._id}
                      className="py-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-medium text-sm text-ink-900">
                          {r.request?.title ?? "Verification"}
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5">
                          {formatDate(r.evaluatedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          tone={r.overallEligible ? "success" : "danger"}
                        >
                          {r.overallEligible ? "Eligible" : "Not eligible"}
                        </Badge>
                        <Link href={`/results/${r._id}`}>
                          <Button size="sm" variant="secondary">
                            View
                          </Button>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Encrypted, reusable, yours.</CardDescription>
            </CardHeader>
            <CardBody>
              {profile === undefined ? (
                <div className="text-sm text-ink-500">Loading…</div>
              ) : profile === null ? (
                <>
                  <Badge tone="warn" className="mb-3">
                    Not set up
                  </Badge>
                  <p className="text-sm text-ink-600 mb-4">
                    Create your encrypted profile to start running checks.
                  </p>
                  <Link href="/profile">
                    <Button size="sm">Create profile</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Badge tone="success" className="mb-3">
                    Encrypted &amp; saved
                  </Badge>
                  <div className="text-xs text-ink-500 mb-4">
                    Last updated {formatDate(profile.updatedAt)}.
                  </div>
                  {profile.onChainTxHash ? (
                    <div className="text-xs text-ink-500 mb-4 break-all">
                      On-chain tx:{" "}
                      <code className="text-[10px]">{profile.onChainTxHash}</code>
                    </div>
                  ) : null}
                  <Link href="/profile">
                    <Button size="sm" variant="secondary">
                      Edit profile
                    </Button>
                  </Link>
                </>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function SkeletonRow() {
  return (
    <div className="space-y-3">
      <div className="h-12 rounded-md bg-ink-50 animate-pulse" />
      <div className="h-12 rounded-md bg-ink-50 animate-pulse" />
    </div>
  );
}
