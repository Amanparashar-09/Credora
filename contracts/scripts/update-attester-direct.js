// Simple script to update attester using ethers directly
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("=".repeat(60));
  console.log("UPDATING CREDIT REGISTRY ATTESTER");
  console.log("=".repeat(60));

  const provider = new ethers.JsonRpcProvider("https://ethereum-hoodi-rpc.publicnode.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Caller:", wallet.address);
  console.log("Chain ID:", (await provider.getNetwork()).chainId);

  const registryAddress = "0xd18267b34e2664bc01fD7A36e457FF59cD24667B";
  const newAttesterAddress = "0x90A942D10A27D9B70Da40EB13F19F0FD1503221D";

  console.log("\nCreditRegistry:", registryAddress);
  console.log("New Attester:", newAttesterAddress);

  const abi = [
    "function attester() view returns (address)",
    "function setAttester(address newAttester) external",
  ];

  const registry = new ethers.Contract(registryAddress, abi, wallet);

  // Check current attester
  try {
    const currentAttester = await registry.attester();
    console.log("\nCurrent Attester:", currentAttester);

    if (currentAttester.toLowerCase() === newAttesterAddress.toLowerCase()) {
      console.log("✅ Attester is already set correctly!");
      return;
    }

    // Update attester
    console.log("\nSending setAttester transaction...");
    const tx = await registry.setAttester(newAttesterAddress);
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
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
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
