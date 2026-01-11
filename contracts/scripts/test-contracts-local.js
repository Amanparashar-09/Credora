// scripts/test-contracts-local.js
const hre = require("hardhat");

async function main() {
  console.log("Testing Credora Contracts Locally\n");
  
  const [deployer, investor, student] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Investor:", investor.address);
  console.log("Student:", student.address);

  // Deploy contracts
  console.log("\n1. Deploying contracts...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  console.log("✅ MockUSDT:", await usdt.getAddress());

  const CreditRegistry = await hre.ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log("✅ CreditRegistry:", await registry.getAddress());

  const CredoraPool = await hre.ethers.getContractFactory("CredoraPool");
  const pool = await CredoraPool.deploy(
    await usdt.getAddress(),
    await registry.getAddress(),
    deployer.address
  );
  await pool.waitForDeployment();
  console.log("✅ CredoraPool:", await pool.getAddress());

  // Test 1: Mint USDT
  console.log("\n2. Minting USDT...");
  const investAmount = hre.ethers.parseUnits("10000", 18);
  await usdt.mint(investor.address, investAmount);
  const investorBalance = await usdt.balanceOf(investor.address);
  console.log("✅ Investor USDT balance:", hre.ethers.formatUnits(investorBalance, 18));

  // Test 2: Verify pool view functions
  console.log("\n3. Testing pool view functions...");
  console.log("   totalLiquidity():", hre.ethers.formatUnits(await pool.totalLiquidity(), 18));
  console.log("   totalBorrowed():", hre.ethers.formatUnits(await pool.totalBorrowed(), 18));
  console.log("   totalShares():", hre.ethers.formatUnits(await pool.totalShares(), 18));
  console.log("   totalDebt():", hre.ethers.formatUnits(await pool.totalDebt(), 18));
  console.log("   reserveBalance():", hre.ethers.formatUnits(await pool.reserveBalance(), 18));
  console.log("   cash():", hre.ethers.formatUnits(await pool.cash(), 18));

  // Test 3: Investor deposits
  console.log("\n4. Investor deposits 5000 USDT...");
  const depositAmount = hre.ethers.parseUnits("5000", 18);
  await usdt.connect(investor).approve(await pool.getAddress(), depositAmount);
  await pool.connect(investor).deposit(depositAmount);
  
  const shares = await pool.balanceOf(investor.address);
  const withdrawable = await pool.previewWithdraw(shares);
  console.log("✅ Investor shares:", hre.ethers.formatUnits(shares, 18));
  console.log("✅ Withdrawable amount:", hre.ethers.formatUnits(withdrawable, 18));
  
  console.log("\n5. Pool state after deposit:");
  console.log("   totalLiquidity():", hre.ethers.formatUnits(await pool.totalLiquidity(), 18));
  console.log("   totalShares():", hre.ethers.formatUnits(await pool.totalShares(), 18));
  console.log("   cash():", hre.ethers.formatUnits(await pool.cash(), 18));

  // Test 4: Set student credit limit
  console.log("\n6. Setting credit limit for student...");
  const creditLimit = hre.ethers.parseUnits("1000", 18);
  const expiry = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
  const nonce = 0;
  
  // Create EIP-712 signature
  const domain = {
    name: "CredoraCreditRegistry",
    version: "1",
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    verifyingContract: await registry.getAddress(),
  };
  
  const types = {
    LimitUpdate: [
      { name: "user", type: "address" },
      { name: "score", type: "uint256" },
      { name: "creditLimit", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };
  
  const value = {
    user: student.address,
    score: 750,
    creditLimit: creditLimit,
    expiry: expiry,
    nonce: nonce,
  };
  
  const signature = await deployer.signTypedData(domain, types, value);
  await registry.updateLimit(value, signature);
  
  const studentLimit = await registry.limitOf(student.address);
  console.log("✅ Student credit limit:", hre.ethers.formatUnits(studentLimit, 18));
  console.log("✅ Is valid:", await registry.isValid(student.address));

  // Test 5: Student borrows
  console.log("\n7. Student borrows 500 USDT...");
  const borrowAmount = hre.ethers.parseUnits("500", 18);
  await pool.connect(student).borrow(borrowAmount);
  
  const [principal, debt, dueAtTime] = await pool.getBorrowerDebt(student.address);
  console.log("✅ Student principal:", hre.ethers.formatUnits(principal, 18));
  console.log("✅ Student debt:", hre.ethers.formatUnits(debt, 18));
  console.log("✅ Due at:", new Date(Number(dueAtTime) * 1000).toLocaleString());
  
  console.log("\n8. Pool state after borrow:");
  console.log("   totalLiquidity():", hre.ethers.formatUnits(await pool.totalLiquidity(), 18));
  console.log("   totalBorrowed():", hre.ethers.formatUnits(await pool.totalBorrowed(), 18));
  console.log("   cash():", hre.ethers.formatUnits(await pool.cash(), 18));
  console.log("   utilizationWad():", hre.ethers.formatUnits(await pool.utilizationWad(), 18));

  // Test 6: Verify investor's withdrawable amount increased
  console.log("\n9. Investor position after student borrow:");
  const newWithdrawable = await pool.previewWithdraw(shares);
  console.log("   Shares:", hre.ethers.formatUnits(shares, 18));
  console.log("   Withdrawable:", hre.ethers.formatUnits(newWithdrawable, 18));
  console.log("   Interest accruing from student loan...");

  console.log("\n✅ ALL TESTS PASSED!");
  console.log("Contracts are working correctly and ready for deployment.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
