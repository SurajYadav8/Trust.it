"use client";

import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";
import type { PublicClient, WalletClient } from "viem";
import abi from "@/contracts/TrstItVerifier.abi.json";
import { CONTRACT_ADDRESS } from "./constants";
import { decryptBool } from "./fhe";

export function isContractConfigured(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);
}

export async function getContract(walletProvider: Eip1193Provider) {
  if (!isContractConfigured()) {
    throw new Error(
      "NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS is not set. Deploy contracts/src/TrstItVerifier.sol and add the address to .env.local."
    );
  }
  const provider = new BrowserProvider(walletProvider);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, abi as unknown as never[], signer);
}

export async function submitProfileOnChain(params: {
  walletProvider: Eip1193Provider;
  salaryCt: unknown;
  creditCt: unknown;
  employmentCt: unknown;
}): Promise<{ txHash: string }> {
  const contract = await getContract(params.walletProvider);
  const tx = await contract.submitProfile(
    params.salaryCt,
    params.creditCt,
    params.employmentCt
  );
  const receipt = await tx.wait();
  return { txHash: receipt?.hash ?? tx.hash };
}

export interface VerificationReadout {
  tenant: string;
  ready: boolean;
  passSalary: boolean;
  passCredit: boolean;
  passEmployment: boolean;
  overallEligible: boolean;
}

/**
 * End-to-end verification:
 * 1. Submit verify(...) tx -> get verificationId from event
 * 2. Read encrypted boolean handles from contract
 * 3. Decrypt each off-chain via the threshold network
 * 4. Compute overall verdict
 */
export async function runVerification(params: {
  walletProvider: Eip1193Provider;
  publicClient: PublicClient;
  walletClient: WalletClient;
  address: string;
  monthlyRent: number;
  salaryMultiplier: number;
  minCreditScore: number;
  minEmploymentMonths: number;
  onProgress?: (msg: string) => void;
}): Promise<VerificationReadout & { verificationId: bigint; txHash: string }> {
  const contract = await getContract(params.walletProvider);

  const minSalary = BigInt(
    Math.ceil(params.monthlyRent * params.salaryMultiplier)
  );
  const minCredit = BigInt(Math.max(0, Math.floor(params.minCreditScore)));
  const minEmp = BigInt(Math.max(0, Math.floor(params.minEmploymentMonths)));

  params.onProgress?.("Sending encrypted comparison on-chain…");
  const tx = await contract.verify(minSalary, minCredit, minEmp);
  const receipt = await tx.wait();
  const txHash = receipt?.hash ?? tx.hash;

  let verificationId: bigint | undefined;
  if (receipt?.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
        if (parsed?.name === "VerificationRequested") {
          verificationId = BigInt(parsed.args.verificationId.toString());
          break;
        }
      } catch {
        // ignore non-matching logs
      }
    }
  }
  if (verificationId === undefined) {
    const next = (await contract.nextVerificationId()) as bigint;
    verificationId = next > 0n ? next - 1n : 0n;
  }

  params.onProgress?.("Reading encrypted boolean handles…");
  const handles = await contract.getVerificationHandles(verificationId);
  const ctHashSalary = BigInt(handles[1].toString());
  const ctHashCredit = BigInt(handles[2].toString());
  const ctHashEmployment = BigInt(handles[3].toString());
  const tenant = handles[0] as string;

  params.onProgress?.(
    "Decrypting booleans via the threshold network (this can take a few seconds)…"
  );

  const [passSalary, passCredit, passEmployment] = await Promise.all([
    decryptBool({
      publicClient: params.publicClient,
      walletClient: params.walletClient,
      address: params.address,
      ctHash: ctHashSalary,
    }),
    decryptBool({
      publicClient: params.publicClient,
      walletClient: params.walletClient,
      address: params.address,
      ctHash: ctHashCredit,
    }),
    decryptBool({
      publicClient: params.publicClient,
      walletClient: params.walletClient,
      address: params.address,
      ctHash: ctHashEmployment,
    }),
  ]);

  const overallEligible = passSalary && passCredit && passEmployment;

  return {
    verificationId,
    txHash,
    tenant,
    ready: true,
    passSalary,
    passCredit,
    passEmployment,
    overallEligible,
  };
}
