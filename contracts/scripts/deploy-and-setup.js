// scripts/deploy-and-setup.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  let nonce = await deployer.getNonce();
  
  console.log("=".repeat(60));
  console.log("CREDORA CONTRACT DEPLOYMENT TO HOODI TESTNET");
  console.log("=".repeat(60));
  console.log("Deploying with account:", await deployer.getAddress());
  console.log("Starting nonce:", nonce);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  // 1) Deploy MockUSDT
  console.log("\n[1/3] Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy({ nonce: nonce++ });
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("✅ MockUSDT deployed:", usdtAddress);

  // Mint initial tokens
  const mintAmount = hre.ethers.parseUnits("1000000", 18); // 1M USDT
  await usdt.mint(deployer.address, mintAmount, { nonce: nonce++ });
  console.log("✅ Minted 1,000,000 USDT to deployer");

  // 2) Deploy CreditRegistry
  console.log("\n[2/3] Deploying CreditRegistry...");
  const CreditRegistry = await hre.ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(deployer.address, { nonce: nonce++ });
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ CreditRegistry deployed:", registryAddress);
  console.log("   Attester set to:", deployer.address);

  // 3) Deploy CredoraPool
  console.log("\n[3/3] Deploying CredoraPool...");
  const CredoraPool = await hre.ethers.getContractFactory("CredoraPool");
  const pool = await CredoraPool.deploy(
    usdtAddress,
    registryAddress,
    deployer.address, // admin
    { nonce: nonce++ }
  );
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("✅ CredoraPool deployed:", poolAddress);
  console.log("   Admin set to:", deployer.address);

  // Verify deployment
  console.log("\n" + "=".repeat(60));
  console.log("VERIFYING DEPLOYMENT");
  console.log("=".repeat(60));
  
  const poolUsdtAddress = await pool.usdt();
  const poolRegistryAddress = await pool.registry();
  const poolAdmin = await pool.admin();
  
  console.log("Pool USDT reference:", poolUsdtAddress);
  console.log("Pool Registry reference:", poolRegistryAddress);
  console.log("Pool Admin:", poolAdmin);
  console.log("Pool Total Shares:", (await pool.totalShares()).toString());
  console.log("Pool Total Debt:", hre.ethers.formatUnits(await pool.totalDebt(), 18));

  // Extract and save ABIs
  console.log("\n" + "=".repeat(60));
  console.log("EXTRACTING ABIs");
  console.log("=".repeat(60));

  const mockUSDTArtifact = await hre.artifacts.readArtifact("MockUSDT");
  const creditRegistryArtifact = await hre.artifacts.readArtifact("CreditRegistry");
  const credoraPoolArtifact = await hre.artifacts.readArtifact("CredoraPool");

  // Save ABIs to backend
  const backendAbiPath = path.join(__dirname, "../../backend/src/abis");
  fs.mkdirSync(backendAbiPath, { recursive: true });
  
  fs.writeFileSync(
    path.join(backendAbiPath, "MockUSDT.json"),
    JSON.stringify(mockUSDTArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(backendAbiPath, "CreditRegistry.json"),
    JSON.stringify(creditRegistryArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(backendAbiPath, "CredoraPool.json"),
    JSON.stringify(credoraPoolArtifact.abi, null, 2)
  );
  console.log("✅ Backend ABIs saved");

  // Save ABIs to frontend
  const frontendAbiPath = path.join(__dirname, "../../frontend/src/abis");
  fs.mkdirSync(frontendAbiPath, { recursive: true });
  
  fs.writeFileSync(
    path.join(frontendAbiPath, "MockUSDT.json"),
    JSON.stringify(mockUSDTArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendAbiPath, "CreditRegistry.json"),
    JSON.stringify(creditRegistryArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendAbiPath, "CredoraPool.json"),
    JSON.stringify(credoraPoolArtifact.abi, null, 2)
  );
  console.log("✅ Frontend ABIs saved");

  // Update environment files
  console.log("\n" + "=".repeat(60));
  console.log("UPDATING ENVIRONMENT FILES");
  console.log("=".repeat(60));

  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();
  const rpcUrl = hre.network.config.url;

  // Update backend .env
  const backendEnvPath = path.join(__dirname, "../../backend/.env");
  let backendEnv = fs.readFileSync(backendEnvPath, "utf8");
  
  backendEnv = backendEnv.replace(/RPC_URL=.*/g, `RPC_URL=${rpcUrl}`);
  backendEnv = backendEnv.replace(/CHAIN_ID=.*/g, `CHAIN_ID=${chainId}`);
  backendEnv = backendEnv.replace(/CREDIT_REGISTRY_ADDRESS=.*/g, `CREDIT_REGISTRY_ADDRESS=${registryAddress}`);
  backendEnv = backendEnv.replace(/CREDORA_POOL_ADDRESS=.*/g, `CREDORA_POOL_ADDRESS=${poolAddress}`);
  backendEnv = backendEnv.replace(/MOCK_USDT_ADDRESS=.*/g, `MOCK_USDT_ADDRESS=${usdtAddress}`);
  backendEnv = backendEnv.replace(/ATTESTER_ADDRESS=.*/g, `ATTESTER_ADDRESS=${deployer.address}`);
  
  fs.writeFileSync(backendEnvPath, backendEnv);
  console.log("✅ Backend .env updated");

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env");
  let frontendEnv = fs.readFileSync(frontendEnvPath, "utf8");
  
  frontendEnv = frontendEnv.replace(/VITE_RPC_URL=.*/g, `VITE_RPC_URL=${rpcUrl}`);
  frontendEnv = frontendEnv.replace(/VITE_CHAIN_ID=.*/g, `VITE_CHAIN_ID=${chainId}`);
  frontendEnv = frontendEnv.replace(/VITE_CREDIT_REGISTRY_ADDRESS=.*/g, `VITE_CREDIT_REGISTRY_ADDRESS=${registryAddress}`);
  frontendEnv = frontendEnv.replace(/VITE_CREDORA_POOL_ADDRESS=.*/g, `VITE_CREDORA_POOL_ADDRESS=${poolAddress}`);
  frontendEnv = frontendEnv.replace(/VITE_MOCK_USDT_ADDRESS=.*/g, `VITE_MOCK_USDT_ADDRESS=${usdtAddress}`);
  
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
      MockUSDT: {
        address: usdtAddress,
        deployer: deployer.address,
      },
      CreditRegistry: {
        address: registryAddress,
        attester: deployer.address,
      },
      CredoraPool: {
        address: poolAddress,
        admin: deployer.address,
        usdt: usdtAddress,
        registry: registryAddress,
      },
    },
  };

  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath);

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   MockUSDT:        ", usdtAddress);
  console.log("   CreditRegistry:  ", registryAddress);
  console.log("   CredoraPool:     ", poolAddress);
  console.log("\n🔑 Deployer Address:", deployer.address);
  console.log("   (Has 1M USDT minted)");
  console.log("\n📦 Next Steps:");
  console.log("   1. Restart your backend server");
  console.log("   2. Refresh your frontend");
  console.log("   3. Connect MetaMask to Hoodi Testnet");
  console.log("   4. Import USDT token:", usdtAddress);
  console.log("   5. Mint USDT for testing using frontend or MetaMask");
  console.log("\n🔗 Block Explorer:");
  console.log("   https://hoodi.blockscout.com/");
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
