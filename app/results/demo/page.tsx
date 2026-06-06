"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";
import { isE2EMode } from "@/lib/e2e";

/** E2E alias: /results/demo → latest seeded demo result */
export default function E2EDemoResultPage() {
  const router = useRouter();
  const fixtures = useQuery(api.seed.getE2EFixtures);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && !isE2EMode()) {
      router.replace("/");
      return;
    }
    if (fixtures?.resultDemoUrl) {
      router.replace(fixtures.resultDemoUrl);
    }
  }, [fixtures, router]);

  if (process.env.NODE_ENV === "production" && !isE2EMode()) return null;

  return (
    <Container className="py-16 flex justify-center">
      <Spinner />
    </Container>
  );
}
