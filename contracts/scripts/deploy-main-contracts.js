// scripts/deploy-main-contracts.js
// Deploys CreditRegistry and CredoraPool (using existing USDT token)
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  let nonce = await deployer.getNonce();
  
  console.log("=".repeat(60));
  console.log("CREDORA MAIN CONTRACTS DEPLOYMENT");
  console.log("=".repeat(60));
  console.log("Deploying with account:", await deployer.getAddress());
  console.log("Starting nonce:", nonce);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // USDT address (you can change this or pass as parameter)
  // For Hoodi testnet, using existing MockUSDT or deploy new one
  const USDT_ADDRESS = process.env.USDT_ADDRESS || "0x21dbfc68743D9a5b2A220de2F68c084f937cEe4F";
  console.log("\nUsing USDT at:", USDT_ADDRESS);

  // 1) Deploy CreditRegistry
  console.log("\n[1/2] Deploying CreditRegistry...");
  const CreditRegistry = await hre.ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(deployer.address, { nonce: nonce++ });
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ CreditRegistry deployed:", registryAddress);
  console.log("   Attester set to:", deployer.address);

  // 2) Deploy CredoraPool
  console.log("\n[2/2] Deploying CredoraPool...");
  const CredoraPool = await hre.ethers.getContractFactory("CredoraPool");
  const pool = await CredoraPool.deploy(
    USDT_ADDRESS,
    registryAddress,
    deployer.address,
    { nonce: nonce++ }
  );
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("✅ CredoraPool deployed:", poolAddress);
  console.log("   Admin set to:", deployer.address);

  // 3) Set pool address in CreditRegistry
  console.log("\n[3/3] Linking CredoraPool to CreditRegistry...");
  await registry.setPool(poolAddress, { nonce: nonce++ });
  console.log("✅ Pool address set in CreditRegistry");

  // Verify deployment
  console.log("\n" + "=".repeat(60));
  console.log("VERIFYING DEPLOYMENT");
  console.log("=".repeat(60));
  
  const poolUsdtAddress = await pool.usdt();
  const poolRegistryAddress = await pool.registry();
  const poolAdmin = await pool.admin();
  const registryPoolAddress = await registry.pool();
  const registryAttester = await registry.attester();
  
  console.log("✓ Pool USDT reference:", poolUsdtAddress);
  console.log("✓ Pool Registry reference:", poolRegistryAddress);
  console.log("✓ Pool Admin:", poolAdmin);
  console.log("✓ Registry Pool reference:", registryPoolAddress);
  console.log("✓ Registry Attester:", registryAttester);
  console.log("✓ Pool Total Shares:", (await pool.totalShares()).toString());
  console.log("✓ Pool Total Debt:", hre.ethers.formatUnits(await pool.totalDebt(), 18));

  // Extract and save ABIs
  console.log("\n" + "=".repeat(60));
  console.log("SAVING ABIs");
  console.log("=".repeat(60));

  const creditRegistryArtifact = await hre.artifacts.readArtifact("CreditRegistry");
  const credoraPoolArtifact = await hre.artifacts.readArtifact("CredoraPool");

  // Save ABIs to backend
  const backendAbiPath = path.join(__dirname, "../../backend/src/abis");
  fs.mkdirSync(backendAbiPath, { recursive: true });
  
  fs.writeFileSync(
    path.join(backendAbiPath, "CreditRegistry.json"),
    JSON.stringify(creditRegistryArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(backendAbiPath, "CredoraPool.json"),
    JSON.stringify(credoraPoolArtifact.abi, null, 2)
  );
  console.log("✅ Backend ABIs saved to:", backendAbiPath);

  // Save ABIs to frontend
  const frontendAbiPath = path.join(__dirname, "../../frontend/src/abis");
  fs.mkdirSync(frontendAbiPath, { recursive: true });
  
  fs.writeFileSync(
    path.join(frontendAbiPath, "CreditRegistry.json"),
    JSON.stringify(creditRegistryArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendAbiPath, "CredoraPool.json"),
    JSON.stringify(credoraPoolArtifact.abi, null, 2)
  );
  console.log("✅ Frontend ABIs saved to:", frontendAbiPath);

  // Update environment files
  console.log("\n" + "=".repeat(60));
  console.log("UPDATING ENVIRONMENT FILES");
  console.log("=".repeat(60));

  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();
  const rpcUrl = hre.network.config.url;

  // Update backend .env
  const backendEnvPath = path.join(__dirname, "../../backend/.env");
  let backendEnv = fs.readFileSync(backendEnvPath, "utf8");
  
  backendEnv = updateEnvVariable(backendEnv, "RPC_URL", rpcUrl);
  backendEnv = updateEnvVariable(backendEnv, "CHAIN_ID", chainId);
  backendEnv = updateEnvVariable(backendEnv, "CREDIT_REGISTRY_ADDRESS", registryAddress);
  backendEnv = updateEnvVariable(backendEnv, "CREDORA_POOL_ADDRESS", poolAddress);
  backendEnv = updateEnvVariable(backendEnv, "ATTESTER_ADDRESS", deployer.address);
  
  fs.writeFileSync(backendEnvPath, backendEnv);
  console.log("✅ Backend .env updated");

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env");
  let frontendEnv = fs.readFileSync(frontendEnvPath, "utf8");
  
  frontendEnv = updateEnvVariable(frontendEnv, "VITE_RPC_URL", rpcUrl);
  frontendEnv = updateEnvVariable(frontendEnv, "VITE_CHAIN_ID", chainId);
  frontendEnv = updateEnvVariable(frontendEnv, "VITE_CREDIT_REGISTRY_ADDRESS", registryAddress);
  frontendEnv = updateEnvVariable(frontendEnv, "VITE_CREDORA_POOL_ADDRESS", poolAddress);
  
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log("✅ Frontend .env updated");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: chainId,
    rpcUrl: rpcUrl,
    deployerAddress: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CreditRegistry: {
        address: registryAddress,
        attester: deployer.address,
        pool: poolAddress,
      },
      CredoraPool: {
        address: poolAddress,
        admin: deployer.address,
        usdt: USDT_ADDRESS,
        registry: registryAddress,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  
  const deploymentPath = path.join(deploymentsDir, `deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath);

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   CreditRegistry:", registryAddress);
  console.log("   CredoraPool:    ", poolAddress);
  console.log("   USDT Token:     ", USDT_ADDRESS);
  console.log("\n👤 Admin/Attester:");
  console.log("   Address:        ", deployer.address);
  console.log("\n📝 Next Steps:");
  console.log("   1. Backend & Frontend .env files have been updated");
  console.log("   2. ABIs have been saved to both projects");
  console.log("   3. Start your backend: cd backend && npm start");
  console.log("   4. Start your frontend: cd frontend && npm run dev");
  console.log("   5. (Optional) Update attester: npx hardhat run scripts/update-attester.js --network hoodi");
  console.log("\n" + "=".repeat(60));
}

// Helper function to update or add env variable
function updateEnvVariable(envContent, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    return envContent.replace(regex, `${key}=${value}`);
  } else {
    return envContent + `\n${key}=${value}`;
  }
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:");
  console.error(error);
  process.exit(1);
});
