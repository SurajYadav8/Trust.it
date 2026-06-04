"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletConnectButton } from "@/components/wallet-connect";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/format";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}

function Onboarding() {
  const search = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const initialRole = (search?.get("role") === "landlord" ? "landlord" : "tenant") as
    | "tenant"
    | "landlord";
  const [role, setRole] = useState<"tenant" | "landlord">(initialRole);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useQuery(
    api.users.get,
    isConnected && address ? { walletAddress: address.toLowerCase() } : "skip"
  );

  const setRoleMutation = useMutation(api.users.setRole);

  useEffect(() => {
    if (!user) return;
    if (user.role === "tenant") router.replace("/dashboard");
    else if (user.role === "landlord") router.replace("/landlord");
  }, [user, router]);

  const handleConfirm = async () => {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      await setRoleMutation({
        walletAddress: address.toLowerCase(),
        role,
      });
      if (role === "tenant") router.push("/dashboard");
      else router.push("/landlord");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-16">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <Badge tone="brand" className="mb-2">
              Step 1 of 1
            </Badge>
            <CardTitle>Choose your role</CardTitle>
            <CardDescription>
              Pick how you&apos;ll use Trst.it. This is locked to your wallet —
              choose carefully.
            </CardDescription>
          </CardHeader>
          <CardBody>
            {!isConnected ? (
              <div className="text-center py-6">
                <p className="text-sm text-ink-600 mb-4">
                  Connect your wallet to continue.
                </p>
                <WalletConnectButton />
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <RoleOption
                    selected={role === "tenant"}
                    onClick={() => setRole("tenant")}
                    title="Tenant"
                    body="I'm renting. I want to prove I qualify without sharing my financial details."
                  />
                  <RoleOption
                    selected={role === "landlord"}
                    onClick={() => setRole("landlord")}
                    title="Landlord"
                    body="I rent out property. I want a clean pass/fail signal — no sensitive PII."
                  />
                </div>

                {user === null ? (
                  <div className="mt-6 rounded-md bg-ink-50 border border-ink-100 p-3 text-xs text-ink-600">
                    Roles are permanent for the life of this wallet. To switch
                    later you&apos;ll need a different wallet.
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-4 rounded-md bg-danger-50 border border-danger-500/30 p-3 text-xs text-danger-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleConfirm} loading={busy} disabled={!address}>
                    Confirm role
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {user === undefined && isConnected ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
            <Spinner /> Checking wallet…
          </div>
        ) : null}
      </div>
    </Container>
  );
}

function RoleOption({
  selected,
  onClick,
  title,
  body,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-md border p-4 transition-colors",
        selected
          ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/30"
          : "border-ink-200 bg-white hover:border-ink-300"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">{title}</span>
        <span
          className={cn(
            "h-4 w-4 rounded-full border-2",
            selected
              ? "border-brand-500 bg-brand-500"
              : "border-ink-300 bg-white"
          )}
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-600 leading-relaxed">{body}</p>
    </button>
  );
}
