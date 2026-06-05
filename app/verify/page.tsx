"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, PageHeading } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extractVerificationSlug } from "@/lib/verify-link";

export default function VerifyEntryPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = extractVerificationSlug(value);
    if (!slug) {
      setError("Enter a verification link or code from your landlord.");
      return;
    }
    setError(null);
    router.push(`/verify/${slug}`);
  };

  return (
    <Container className="py-10">
      <PageHeading
        title="Verify New Request"
        description="Paste the share link or code your landlord sent you."
      />

      <Card className="mx-auto max-w-lg">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://…/verify/abc123 or abc123"
              aria-label="Verification link or code"
            />
            {error ? (
              <p className="text-xs text-danger-600 dark:text-danger-500">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
}
