// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  let nonce = await deployer.getNonce();
  
  console.log("Deploying with account:", await deployer.getAddress());
  console.log("Starting nonce:", nonce);

  // 1) Deploy MockUSDT
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy({ nonce: nonce++ });
  await usdt.waitForDeployment();
  console.log("MockUSDT deployed:", await usdt.getAddress());

  // mint some tokens for testing
  await usdt.mint(deployer.address, hre.ethers.parseUnits("100000", 18), { nonce: nonce++ });
  console.log("Minted USDT tokens");

  // 2) Deploy CreditRegistry (attester = deployer for now)
  const CreditRegistry = await hre.ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(deployer.address, { nonce: nonce++ });
  await registry.waitForDeployment();
  console.log("CreditRegistry deployed:", await registry.getAddress());

  // 3) Deploy CredoraPool
  const CredoraPool = await hre.ethers.getContractFactory("CredoraPool");
  const pool = await CredoraPool.deploy(
    await usdt.getAddress(),
    await registry.getAddress(),
    deployer.address, // admin
    { nonce: nonce++ }
  );
  await pool.waitForDeployment();
  console.log("CredoraPool deployed:", await pool.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("MockUSDT:", await usdt.getAddress());
  console.log("Registry:", await registry.getAddress());
  console.log("Pool:", await pool.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
