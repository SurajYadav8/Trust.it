"use client";

import { ReactNode, useEffect } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { WalletConnectButton } from "@/components/wallet-connect";
import { Badge } from "@/components/ui/badge";

type Role = "tenant" | "landlord";

interface Props {
  role: Role;
  children: ReactNode;
}

export function RoleGuard({ role, children }: Props) {
  const { address, isConnected, status } = useAccount();
  const router = useRouter();

  const user = useQuery(
    api.users.get,
    isConnected && address ? { walletAddress: address.toLowerCase() } : "skip"
  );

  useEffect(() => {
    if (!isConnected) return;
    if (user === undefined) return;
    if (user === null) {
      router.replace("/onboarding");
      return;
    }
    if (user.role !== role) {
      if (user.role === "tenant") router.replace("/dashboard");
      else if (user.role === "landlord") router.replace("/landlord");
    }
  }, [isConnected, user, role, router]);

  if (status === "connecting" || status === "reconnecting") {
    return <CenterCard>Reconnecting wallet…</CenterCard>;
  }

  if (!isConnected || !address) {
    return (
      <CenterCard>
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge tone="brand">Wallet required</Badge>
          <h2 className="text-lg font-semibold text-ink-900">
            Connect your wallet to continue
          </h2>
          <p className="text-sm text-ink-500 max-w-sm">
            Your wallet is your identity on Trst.it. No accounts, no passwords.
          </p>
          <WalletConnectButton />
        </div>
      </CenterCard>
    );
  }

  if (user === undefined) {
    return <CenterCard>Loading account…</CenterCard>;
  }

  if (user === null || user.role !== role) {
    return <CenterCard>Redirecting…</CenterCard>;
  }

  return <>{children}</>;
}

function CenterCard({ children }: { children: ReactNode }) {
  return (
    <Container className="py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardBody className="py-10 flex items-center justify-center gap-3 text-sm text-ink-600">
            {typeof children === "string" ? (
              <>
                <Spinner />
                <span>{children}</span>
              </>
            ) : (
              children
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
