import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer signer available. Set PRIVATE_KEY in contracts/.env."
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`\nDeployer: ${deployer.address}`);
  console.log(`Network:  ${network.name} (chainId ${network.config.chainId})`);
  console.log(`Balance:  ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.warn(
      "WARNING: deployer balance is 0. Fund it from a faucet before retrying."
    );
  }

  const Factory = await ethers.getContractFactory("TrstItVerifier");
  console.log("Deploying TrstItVerifier...");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\nTrstItVerifier deployed: ${address}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Paste this address into the project root .env.local:`);
  console.log(`       NEXT_PUBLIC_TRSTIT_CONTRACT_ADDRESS=${address}`);
  console.log(`  2. Restart \`npm run dev\` so Next.js picks up the new env.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
