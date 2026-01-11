// scripts/update-attester.js
const hre = require("hardhat");

async function main() {
  console.log("=".repeat(60));
  console.log("UPDATING CREDIT REGISTRY ATTESTER");
  console.log("=".repeat(60));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Caller:", await deployer.getAddress());

  // Contract address from .env
  const registryAddress = "0xd18267b34e2664bc01fD7A36e457FF59cD24667B";
  const newAttesterAddress = "0x90A942D10A27D9B70Da40EB13F19F0FD1503221D"; // Backend attester

  console.log("\nCreditRegistry:", registryAddress);
  console.log("New Attester:", newAttesterAddress);

  // Get contract instance
  const registry = await hre.ethers.getContractAt("CreditRegistry", registryAddress);

  // Check current attester
  const currentAttester = await registry.attester();
  console.log("\nCurrent Attester:", currentAttester);

  if (currentAttester.toLowerCase() === newAttesterAddress.toLowerCase()) {
    console.log("✅ Attester is already set correctly!");
    return;
  }

  // Update attester
  console.log("\nUpdating attester...");
  const tx = await registry.setAttester(newAttesterAddress);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Transaction confirmed!");

  // Verify
  const updatedAttester = await registry.attester();
  console.log("\nUpdated Attester:", updatedAttester);
  
  if (updatedAttester.toLowerCase() === newAttesterAddress.toLowerCase()) {
    console.log("✅ Attester updated successfully!");
  } else {
    console.log("❌ Attester update failed!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
