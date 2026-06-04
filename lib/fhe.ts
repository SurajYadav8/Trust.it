"use client";

import type { PublicClient, WalletClient } from "viem";
import { ACTIVE_CHAIN } from "./constants";

type AnyPublicClient = PublicClient;
type AnyWalletClient = WalletClient;

let clientPromise: Promise<unknown> | null = null;
let connectKey: string | null = null;
let connectPromise: Promise<void> | null = null;

async function getSdk() {
  return await import("@cofhe/sdk/web");
}

async function getCore() {
  return await import("@cofhe/sdk");
}

async function getChains() {
  return await import("@cofhe/sdk/chains");
}

async function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const { createCofheConfig, createCofheClient } = await getSdk();
    const { chains } = await getChains();
    const chain =
      ACTIVE_CHAIN.id === 11155111 ? chains.sepolia : chains.arbSepolia;
    const config = createCofheConfig({ supportedChains: [chain] });
    return createCofheClient(config);
  })();
  return clientPromise;
}

async function ensureConnected(params: {
  publicClient: AnyPublicClient;
  walletClient: AnyWalletClient;
  address: string;
}): Promise<unknown> {
  const client = (await getClient()) as {
    connected: boolean;
    connect: (
      pc: AnyPublicClient,
      wc: AnyWalletClient
    ) => Promise<void>;
  };
  const key = `${params.address.toLowerCase()}@${params.publicClient.chain?.id ?? "?"}`;
  if (connectKey === key && client.connected) return client;
  if (connectKey === key && connectPromise) {
    await connectPromise;
    return client;
  }
  connectKey = key;
  connectPromise = client.connect(params.publicClient, params.walletClient);
  try {
    await connectPromise;
  } finally {
    connectPromise = null;
  }
  return client;
}

export async function ensureFheReady(params: {
  publicClient: AnyPublicClient;
  walletClient: AnyWalletClient;
  address: string;
}): Promise<void> {
  await ensureConnected(params);
}

export interface EncryptedProfileInputs {
  salaryCt: unknown;
  creditCt: unknown;
  employmentCt: unknown;
  serialized: {
    salary: string;
    credit: string;
    employment: string;
  };
}

export type EncryptProgress = (state: string) => void;

export async function encryptProfile(params: {
  publicClient: AnyPublicClient;
  walletClient: AnyWalletClient;
  address: string;
  salary: number;
  creditScore: number;
  employmentMonths: number;
  onState?: EncryptProgress;
}): Promise<EncryptedProfileInputs> {
  const client = (await ensureConnected(params)) as {
    encryptInputs: (
      inputs: unknown[]
    ) => {
      onStep: (
        cb: (step: string, ctx: unknown) => void
      ) => {
        execute: () => Promise<unknown[]>;
      };
    };
  };
  const { Encryptable } = await getCore();

  try {
    const result = await client
      .encryptInputs([
        Encryptable.uint64(BigInt(Math.max(0, Math.floor(params.salary)))),
        Encryptable.uint32(BigInt(Math.max(0, Math.floor(params.creditScore)))),
        Encryptable.uint32(
          BigInt(Math.max(0, Math.floor(params.employmentMonths)))
        ),
      ])
      .onStep((step) => {
        if (params.onState) params.onState(String(step));
      })
      .execute();

    const [salaryCt, creditCt, employmentCt] = result;
    return {
      salaryCt,
      creditCt,
      employmentCt,
      serialized: {
        salary: safeStringify(salaryCt),
        credit: safeStringify(creditCt),
        employment: safeStringify(employmentCt),
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Trst.it] encryptInputs failed:", err);
    throw new Error(formatError(err, "Encryption failed"));
  }
}

/**
 * Decrypt an ebool ciphertext that was made public via FHE.allowPublic in the
 * contract. Returns the plaintext boolean.
 */
export async function decryptBool(params: {
  publicClient: AnyPublicClient;
  walletClient: AnyWalletClient;
  address: string;
  ctHash: bigint;
}): Promise<boolean> {
  const client = (await ensureConnected(params)) as {
    decryptForTx: (ctHash: bigint) => {
      withoutPermit: () => {
        execute: () => Promise<{
          decryptedValue: bigint;
          signature: `0x${string}`;
        }>;
      };
    };
  };

  try {
    const { decryptedValue } = await client
      .decryptForTx(params.ctHash)
      .withoutPermit()
      .execute();
    return decryptedValue !== 0n;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Trst.it] decryptForTx failed:", err);
    throw new Error(formatError(err, "Decryption failed"));
  }
}

function safeStringify(v: unknown): string {
  return JSON.stringify(v, (_k, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

function formatError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === "string") return `${fallback}: ${err}`;
  if (err instanceof Error) return `${fallback}: ${err.message}`;
  if (typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    const code = anyErr.code ?? anyErr.name ?? "";
    const message = anyErr.message ?? anyErr.reason ?? JSON.stringify(err);
    return `${fallback} [${String(code)}]: ${String(message)}`;
  }
  return `${fallback}: ${String(err)}`;
}
