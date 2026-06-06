"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/role-guard";
import {
  DashboardStatGrid,
  LandlordOnboarding,
} from "@/components/landlord/shared";
import {
  LandlordProperty,
  aggregateLandlordStats,
} from "@/lib/landlord-property";

export default function LandlordDashboardPage() {
  return (
    <RoleGuard role="landlord">
      <LandlordDashboard />
    </RoleGuard>
  );
}

function LandlordDashboard() {
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
        title="Dashboard"
        description="Overview of your property screenings and applicant outcomes."
        action={
          list.length > 0 ? (
            <Link href="/landlord/requests/new">
              <Button>Create screening</Button>
            </Link>
          ) : undefined
        }
      />

      {properties === undefined ? (
        <LandlordDashboardSkeleton />
      ) : list.length === 0 ? (
        <LandlordOnboarding />
      ) : (
        <LandlordOverview properties={list} />
      )}
    </Container>
  );
}

function LandlordOverview({ properties }: { properties: LandlordProperty[] }) {
  const stats = aggregateLandlordStats(properties);

  return (
    <div className="space-y-8">
      <DashboardStatGrid {...stats} />

      <div className="flex flex-wrap gap-3">
        <Link href="/landlord/properties">
          <Button variant="secondary">View properties</Button>
        </Link>
        <Link href="/landlord/results">
          <Button variant="secondary">Review results</Button>
        </Link>
      </div>
    </div>
  );
}

function LandlordDashboardSkeleton() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
      <div className="h-80 rounded-lg bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
      <div className="space-y-4">
        <div className="h-36 rounded-lg bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
        <div className="h-44 rounded-lg bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
      </div>
    </div>
  );
}
