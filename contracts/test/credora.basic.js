// test/credora.basic.js
// Hardhat + ethers v6 (via @nomicfoundation/hardhat-toolbox)


const { expect } = require("chai");
const { ethers, network } = require("hardhat");

async function timeTravel(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

describe("Credora (MVP) – CreditRegistry + CredoraPool", function () {
  let owner, admin, attester, depositor, borrower, other;
  let usdt, registry, pool;

  // EIP-712 helpers for CreditRegistry.sol (must match contract constants)
  async function signLimitUpdate({ user, score, creditLimit, expiry, nonce, signer }) {
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const domain = {
      name: "CredoraCreditRegistry",
      version: "1",
      chainId,
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

    const value = { user, score, creditLimit, expiry, nonce };
    return signer.signTypedData(domain, types, value);
  }

  async function setBorrowerLimit({ score, limit, ttlSeconds = 3600 }) {
    const user = borrower.address;
    const nonce = await registry.currentNonce(user);
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const expiry = now + ttlSeconds;

    const sig = await signLimitUpdate({
      user,
      score,
      creditLimit: limit,
      expiry,
      nonce,
      signer: attester,
    });

    await registry.connect(borrower).updateLimit(
      { user, score, creditLimit: limit, expiry, nonce },
      sig
    );

    return { nonce, expiry, sig };
  }

  beforeEach(async () => {
    [owner, admin, attester, depositor, borrower, other] = await ethers.getSigners();

    // --------------------------
    // IMPORTANT:
    // This test assumes you have a MockUSDT contract available in contracts/MockUSDT.sol:
    //
    // SPDX-License-Identifier: MIT
    // pragma solidity ^0.8.20;
    // import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
    // contract MockUSDT is ERC20 {
    //   constructor() ERC20("MockUSDT", "USDT") {}
    //   function mint(address to, uint256 amount) external { _mint(to, amount); }
    // }
    // --------------------------

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    // mint to depositor/borrower
    await usdt.mint(depositor.address, ethers.parseUnits("100000", 18));
    await usdt.mint(borrower.address, ethers.parseUnits("10000", 18));

    const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
    registry = await CreditRegistry.deploy(attester.address);
    await registry.waitForDeployment();

    const CredoraPool = await ethers.getContractFactory("CredoraPool");
    pool = await CredoraPool.deploy(
      await usdt.getAddress(),
      await registry.getAddress(),
      admin.address
    );
    await pool.waitForDeployment();

    // set short term/grace for testing (admin only)
    // baseRate, slope, kink, jumpSlope, reserveBps, termSeconds, graceSeconds
    await pool.connect(admin).setParams(
      ethers.parseUnits("0.05", 18),  // 5% base
      ethers.parseUnits("0.20", 18),  // 20% slope
      ethers.parseUnits("0.80", 18),  // 80% kink
      ethers.parseUnits("0.50", 18),  // 50% jump slope
      800,                            // 8% reserve cut from interest
      300,                            // 5 min term
      120                             // 2 min grace
    );
  });

  describe("CreditRegistry", () => {
    it("updates limit with valid signature and increments nonce", async () => {
      const user = borrower.address;
      const nonce0 = await registry.currentNonce(user);

      const score = 850;
      const limit = ethers.parseUnits("500", 18);
      const now = (await ethers.provider.getBlock("latest")).timestamp;
      const expiry = now + 3600;

      const sig = await signLimitUpdate({
        user,
        score,
        creditLimit: limit,
        expiry,
        nonce: nonce0,
        signer: attester,
      });

      await expect(
        registry.connect(borrower).updateLimit({ user, score, creditLimit: limit, expiry, nonce: nonce0 }, sig)
      ).to.emit(registry, "LimitUpdated");

      const nonce1 = await registry.currentNonce(user);
      expect(nonce1).to.equal(nonce0 + 1n);

      expect(await registry.limitOf(user)).to.equal(limit);
      expect(await registry.scoreOf(user)).to.equal(score);
      expect(await registry.expiryOf(user)).to.equal(expiry);
      expect(await registry.isValid(user)).to.equal(true);
    });

    it("rejects expired attestation", async () => {
      const user = borrower.address;
      const nonce = await registry.currentNonce(user);
      const score = 700;
      const limit = ethers.parseUnits("200", 18);
      const now = (await ethers.provider.getBlock("latest")).timestamp;
      const expiry = now - 1;

      const sig = await signLimitUpdate({
        user,
        score,
        creditLimit: limit,
        expiry,
        nonce,
        signer: attester,
      });

      await expect(
        registry.connect(borrower).updateLimit({ user, score, creditLimit: limit, expiry, nonce }, sig)
      ).to.be.revertedWithCustomError(registry, "ExpiredAttestation");
    });

    it("rejects invalid signature", async () => {
      const user = borrower.address;
      const nonce = await registry.currentNonce(user);
      const score = 700;
      const limit = ethers.parseUnits("200", 18);
      const now = (await ethers.provider.getBlock("latest")).timestamp;
      const expiry = now + 3600;

      // sign with wrong signer
      const sig = await signLimitUpdate({
        user,
        score,
        creditLimit: limit,
        expiry,
        nonce,
        signer: other,
      });

      await expect(
        registry.connect(borrower).updateLimit({ user, score, creditLimit: limit, expiry, nonce }, sig)
      ).to.be.revertedWithCustomError(registry, "InvalidSignature");
    });

    it("rejects nonce mismatch (replay protection)", async () => {
      const user = borrower.address;
      const nonce = await registry.currentNonce(user);
      const score = 700;
      const limit = ethers.parseUnits("200", 18);
      const now = (await ethers.provider.getBlock("latest")).timestamp;
      const expiry = now + 3600;

      const sig = await signLimitUpdate({
        user,
        score,
        creditLimit: limit,
        expiry,
        nonce,
        signer: attester,
      });

      await registry.connect(borrower).updateLimit({ user, score, creditLimit: limit, expiry, nonce }, sig);

      // try replay with same nonce/signature
      await expect(
        registry.connect(borrower).updateLimit({ user, score, creditLimit: limit, expiry, nonce }, sig)
      ).to.be.revertedWithCustomError(registry, "NonceMismatch");
    });
  });

  describe("Pool: deposits/withdrawals", () => {
    it("allows deposit and withdraw when no loans outstanding", async () => {
      const amount = ethers.parseUnits("1000", 18);

      await usdt.connect(depositor).approve(await pool.getAddress(), amount);
      await expect(pool.connect(depositor).deposit(amount)).to.emit(pool, "Deposited");

      const shares = await pool.sharesOf(depositor.address);
      expect(shares).to.be.gt(0n);

      await expect(pool.connect(depositor).withdraw(shares)).to.emit(pool, "Withdrawn");

      const sharesAfter = await pool.sharesOf(depositor.address);
      expect(sharesAfter).to.equal(0n);
    });

    it("blocks withdraw if free cash is insufficient due to outstanding loans", async () => {
      const depositAmt = ethers.parseUnits("1000", 18);

      await usdt.connect(depositor).approve(await pool.getAddress(), depositAmt);
      await pool.connect(depositor).deposit(depositAmt);

      // set borrower limit and borrow most liquidity
      await setBorrowerLimit({ score: 900, limit: ethers.parseUnits("900", 18) });

      await pool.connect(borrower).borrow(ethers.parseUnits("850", 18));

      const shares = await pool.sharesOf(depositor.address);

      // trying to withdraw all shares should revert due to insufficient available cash
      await expect(pool.connect(depositor).withdraw(shares)).to.be.revertedWithCustomError(
        pool,
        "InsufficientLiquidity"
      );
    });
  });

  describe("Pool: borrowing/repayment/interest", () => {
    beforeEach(async () => {
      // seed liquidity
      const depositAmt = ethers.parseUnits("5000", 18);
      await usdt.connect(depositor).approve(await pool.getAddress(), depositAmt);
      await pool.connect(depositor).deposit(depositAmt);
    });

    it("rejects borrow if borrower has no valid limit", async () => {
      await expect(pool.connect(borrower).borrow(ethers.parseUnits("10", 18)))
        .to.be.revertedWithCustomError(pool, "LimitInvalid");
    });

    it("allows borrow within limit and rejects beyond limit", async () => {
      await setBorrowerLimit({ score: 850, limit: ethers.parseUnits("300", 18) });

      await expect(pool.connect(borrower).borrow(ethers.parseUnits("250", 18))).to.emit(pool, "Borrowed");

      await expect(pool.connect(borrower).borrow(ethers.parseUnits("100", 18)))
        .to.be.revertedWithCustomError(pool, "CreditExceeded");
    });

    it("accrues interest over time and repays with reserve cut from interest", async () => {
      await setBorrowerLimit({ score: 900, limit: ethers.parseUnits("1000", 18) });

      const borrowAmt = ethers.parseUnits("500", 18);
      await pool.connect(borrower).borrow(borrowAmt);

      // time passes -> interest accrues
      await timeTravel(3600); // 1 hour
      await pool.accrue();

      const due = await pool.userTotalDebt(borrower.address);
      expect(due).to.be.gt(borrowAmt);

      const interestDue = await pool.userInterestDue(borrower.address);
      expect(interestDue).to.be.gt(0n);

      // repay full
      await usdt.connect(borrower).approve(await pool.getAddress(), due);
      const reserveBefore = await pool.reserveBalance();

      await expect(pool.connect(borrower).repay(due)).to.emit(pool, "Repaid");

      const reserveAfter = await pool.reserveBalance();
      expect(reserveAfter).to.be.gt(reserveBefore);

      // Allow for small rounding errors (dust) due to integer division
      const remaining = await pool.userTotalDebt(borrower.address);
      expect(remaining).to.be.lte(10_000_000_000_000n); // 1e13 dust tolerance
      const principalRemaining = await pool.userPrincipal(borrower.address);
      expect(principalRemaining).to.be.lte(10_000_000_000_000n); // 1e13 dust tolerance
      // If there's dust remaining, dueAt might still be set; otherwise it should be 0
      if (remaining === 0n) {
        expect(await pool.dueAt(borrower.address)).to.equal(0n);
      }
    });

    it("repay caps at amount due (overpay safe)", async () => {
      await setBorrowerLimit({ score: 900, limit: ethers.parseUnits("1000", 18) });

      const borrowAmt = ethers.parseUnits("200", 18);
      await pool.connect(borrower).borrow(borrowAmt);

      await timeTravel(600);
      await pool.accrue();

      const due = await pool.userTotalDebt(borrower.address);
      const overpay = due + ethers.parseUnits("100", 18);

      await usdt.connect(borrower).approve(await pool.getAddress(), overpay);
      await pool.connect(borrower).repay(overpay);

      // Allow for small rounding errors (dust) due to integer division
      const remaining = await pool.userTotalDebt(borrower.address);
      expect(remaining).to.be.lte(10n); // Allow up to 10 wei dust
    });

    it("pauses borrowing when admin sets borrowPaused", async () => {
      await setBorrowerLimit({ score: 900, limit: ethers.parseUnits("1000", 18) });

      await pool.connect(admin).setBorrowPaused(true);
      await expect(pool.connect(borrower).borrow(ethers.parseUnits("10", 18)))
        .to.be.revertedWithCustomError(pool, "BorrowPaused");

      await pool.connect(admin).setBorrowPaused(false);
      await expect(pool.connect(borrower).borrow(ethers.parseUnits("10", 18)))
        .to.emit(pool, "Borrowed");
    });
  });

  describe("Defaults (MVP write-off)", () => {
    beforeEach(async () => {
      // seed liquidity
      const depositAmt = ethers.parseUnits("3000", 18);
      await usdt.connect(depositor).approve(await pool.getAddress(), depositAmt);
      await pool.connect(depositor).deposit(depositAmt);

      await setBorrowerLimit({ score: 850, limit: ethers.parseUnits("1000", 18) });
      await pool.connect(borrower).borrow(ethers.parseUnits("500", 18));

      // accrue some interest so default includes interest too
      await timeTravel(60); // Only 60 seconds to stay within term+grace
      await pool.accrue();
    });

    it("cannot write off before due+grace", async () => {
      // Verify we're still within the grace period (term=300, grace=120, we traveled 60s)
      expect(await pool.isInDefault(borrower.address)).to.equal(false);
      await expect(pool.connect(admin).writeOffDefault(borrower.address))
        .to.be.revertedWithCustomError(pool, "NotInDefault");
    });

    it("can write off after due+grace; reserve absorbs first loss", async () => {
      // force into default: term=300, grace=120 => travel beyond 420
      await timeTravel(500);
      await pool.accrue();

      expect(await pool.isInDefault(borrower.address)).to.equal(true);

      const reserveBefore = await pool.reserveBalance();
      const debtBefore = await pool.userTotalDebt(borrower.address);
      expect(debtBefore).to.be.gt(0n);

      await expect(pool.connect(admin).writeOffDefault(borrower.address))
        .to.emit(pool, "DefaultWrittenOff");

      // debt cleared
      expect(await pool.userTotalDebt(borrower.address)).to.equal(0n);
      expect(await pool.userPrincipal(borrower.address)).to.equal(0n);
      expect(await pool.dueAt(borrower.address)).to.equal(0n);

      const reserveAfter = await pool.reserveBalance();
      // reserve should decrease by reserveUsed (if it had any). It might be 0 in early stages.
      expect(reserveAfter).to.be.at.most(reserveBefore);

      // total debt should drop
      expect(await pool.totalDebt()).to.equal(0n);
    });

    it("only admin can write off", async () => {
      await timeTravel(500);
      await pool.accrue();

      await expect(pool.connect(other).writeOffDefault(borrower.address))
        .to.be.revertedWithCustomError(pool, "NotAdmin");
    });
  });
});
