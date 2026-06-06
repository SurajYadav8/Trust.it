"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/role-guard";
import { PropertyCard } from "@/components/landlord/shared";
import { LandlordProperty } from "@/lib/landlord-property";
import { EMPTY_STATE_CLASS, SECONDARY_CARD_CLASS } from "@/lib/ui-classes";
import { cn } from "@/lib/format";

export default function LandlordPropertiesPage() {
  return (
    <RoleGuard role="landlord">
      <LandlordProperties />
    </RoleGuard>
  );
}

function LandlordProperties() {
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
        title="Properties"
        description="Manage screening links for each property."
        action={
          <Link href="/landlord/requests/new">
            <Button>Create screening</Button>
          </Link>
        }
      />

      {properties === undefined ? (
        <Card className={SECONDARY_CARD_CLASS}>
          <CardBody>
            <div className="space-y-3">
              <div className="h-20 rounded-md bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
              <div className="h-20 rounded-md bg-ink-50 animate-pulse dark:bg-white/[0.04]" />
            </div>
          </CardBody>
        </Card>
      ) : list.length === 0 ? (
        <div className={cn(EMPTY_STATE_CLASS, "py-14")}>
          <h2 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
            No properties yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500 dark:text-white/45">
            Create your first property screening to get a shareable verification
            link.
          </p>
          <div className="mt-6">
            <Link href="/landlord/requests/new">
              <Button>Create screening</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      )}
    </Container>
  );
}
