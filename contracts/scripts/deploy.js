// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // 1) Deploy MockUSDT
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();

  // mint some tokens for testing
  await usdt.mint(deployer.address, hre.ethers.parseUnits("100000", 18));

  // 2) Deploy CreditRegistry (attester = deployer for now)
  const CreditRegistry = await hre.ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(deployer.address);
  await registry.waitForDeployment();

  // 3) Deploy CredoraPool
  const CredoraPool = await hre.ethers.getContractFactory("CredoraPool");
  const pool = await CredoraPool.deploy(
    await usdt.getAddress(),
    await registry.getAddress(),
    deployer.address // admin
  );
  await pool.waitForDeployment();

  console.log("MockUSDT:", await usdt.getAddress());
  console.log("Registry:", await registry.getAddress());
  console.log("Pool:", await pool.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
