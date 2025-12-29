const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // replace with real USDT address on your target chain
  const USDT = "0x0000000000000000000000000000000000000000";

  // backend/oracle attester key (EOA for MVP; later multisig/HSM)
  const ATTESTER = deployer.address;

  const CreditRegistry = await hre.ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(ATTESTER);
  await registry.waitForDeployment();

  const CredoraPool = await hre.ethers.getContractFactory("CredoraPool");
  const pool = await CredoraPool.deploy(USDT, await registry.getAddress(), deployer.address);
  await pool.waitForDeployment();

  console.log("Registry:", await registry.getAddress());
  console.log("Pool:", await pool.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
