// test/credora.advanced.js
// Additional comprehensive tests for CreditRegistry and CredoraPool

const { expect } = require("chai");
const { ethers, network } = require("hardhat");

async function timeTravel(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

describe("Credora Advanced Tests", function () {
  let owner, admin, attester, newAttester, depositor1, depositor2, borrower1, borrower2, other;
  let usdt, registry, pool;

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
    return signer.signTypedData(domain, types, { user, score, creditLimit, expiry, nonce });
  }

  async function setBorrowerLimit({ borrower, score, limit, ttlSeconds = 3600 }) {
    const user = borrower.address;
    const nonce = await registry.currentNonce(user);
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const expiry = now + ttlSeconds;
    const sig = await signLimitUpdate({
      user, score, creditLimit: limit, expiry, nonce, signer: attester,
    });
    await registry.connect(borrower).updateLimit(
      { user, score, creditLimit: limit, expiry, nonce }, sig
    );
  }

  beforeEach(async () => {
    [owner, admin, attester, newAttester, depositor1, depositor2, borrower1, borrower2, other] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    await usdt.mint(depositor1.address, ethers.parseUnits("100000", 18));
    await usdt.mint(depositor2.address, ethers.parseUnits("100000", 18));
    await usdt.mint(borrower1.address, ethers.parseUnits("10000", 18));
    await usdt.mint(borrower2.address, ethers.parseUnits("10000", 18));

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

    await pool.connect(admin).setParams(
      ethers.parseUnits("0.05", 18),
      ethers.parseUnits("0.20", 18),
      ethers.parseUnits("0.80", 18),
      ethers.parseUnits("0.50", 18),
      800,
      300,
      120
    );
  });

  describe("CreditRegistry Advanced", () => {
    describe("Attester Management", () => {
      it("allows changing attester", async () => {
        await expect(registry.setAttester(newAttester.address))
          .to.emit(registry, "AttesterUpdated")
          .withArgs(attester.address, newAttester.address);
        
        expect(await registry.attester()).to.equal(newAttester.address);
      });

      it("rejects zero address as attester", async () => {
        await expect(registry.setAttester(ethers.ZeroAddress))
          .to.be.revertedWithCustomError(registry, "ZeroAttester");
      });

      it("new attester can sign updates", async () => {
        await registry.setAttester(newAttester.address);
        
        const user = borrower1.address;
        const nonce = await registry.currentNonce(user);
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const sig = await signLimitUpdate({
          user, score: 700, creditLimit: ethers.parseUnits("100", 18),
          expiry: now + 3600, nonce, signer: newAttester,
        });

        await expect(
          registry.connect(borrower1).updateLimit(
            { user, score: 700, creditLimit: ethers.parseUnits("100", 18), expiry: now + 3600, nonce },
            sig
          )
        ).to.emit(registry, "LimitUpdated");
      });
    });

    describe("getCreditLimit", () => {
      it("returns correct limit and expiry", async () => {
        const limit = ethers.parseUnits("500", 18);
        const user = borrower1.address;
        const nonce = await registry.currentNonce(user);
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const expiry = now + 3600;

        const sig = await signLimitUpdate({
          user, score: 850, creditLimit: limit, expiry, nonce, signer: attester,
        });
        await registry.connect(borrower1).updateLimit(
          { user, score: 850, creditLimit: limit, expiry, nonce }, sig
        );

        const [returnedLimit, returnedExpiry] = await registry.getCreditLimit(user);
        expect(returnedLimit).to.equal(limit);
        expect(returnedExpiry).to.equal(expiry);
      });
    });

    describe("verify function", () => {
      it("returns true for valid signature", async () => {
        const user = borrower1.address;
        const nonce = await registry.currentNonce(user);
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const update = { user, score: 700, creditLimit: ethers.parseUnits("100", 18), expiry: now + 3600, nonce };
        const sig = await signLimitUpdate({ ...update, signer: attester });

        expect(await registry.verify(update, sig)).to.equal(true);
      });

      it("returns false for invalid signature", async () => {
        const user = borrower1.address;
        const nonce = await registry.currentNonce(user);
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const update = { user, score: 700, creditLimit: ethers.parseUnits("100", 18), expiry: now + 3600, nonce };
        const sig = await signLimitUpdate({ ...update, signer: other });

        expect(await registry.verify(update, sig)).to.equal(false);
      });
    });

    describe("Error Cases", () => {
      it("rejects zero user address", async () => {
        const nonce = 0;
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const update = {
          user: ethers.ZeroAddress,
          score: 700,
          creditLimit: ethers.parseUnits("100", 18),
          expiry: now + 3600,
          nonce
        };
        const sig = await signLimitUpdate({ ...update, signer: attester });

        await expect(
          registry.updateLimit(update, sig)
        ).to.be.revertedWithCustomError(registry, "ZeroUser");
      });
    });
  });

  describe("CredoraPool Advanced", () => {
    describe("Admin Functions", () => {
      it("allows admin to change admin", async () => {
        await expect(pool.connect(admin).setAdmin(other.address))
          .to.emit(pool, "AdminSet")
          .withArgs(other.address);
        
        expect(await pool.admin()).to.equal(other.address);
      });

      it("rejects zero address as admin", async () => {
        await expect(pool.connect(admin).setAdmin(ethers.ZeroAddress))
          .to.be.revertedWithCustomError(pool, "BadParams");
      });

      it("only admin can change admin", async () => {
        await expect(pool.connect(other).setAdmin(other.address))
          .to.be.revertedWithCustomError(pool, "NotAdmin");
      });

      it("validates setParams constraints", async () => {
        // kinkUtilWad > WAD should revert
        await expect(
          pool.connect(admin).setParams(
            ethers.parseUnits("0.05", 18),
            ethers.parseUnits("0.20", 18),
            ethers.parseUnits("1.1", 18), // > WAD
            ethers.parseUnits("0.50", 18),
            800, 300, 120
          )
        ).to.be.revertedWithCustomError(pool, "BadParams");

        // reserveBps > 3000 should revert
        await expect(
          pool.connect(admin).setParams(
            ethers.parseUnits("0.05", 18),
            ethers.parseUnits("0.20", 18),
            ethers.parseUnits("0.80", 18),
            ethers.parseUnits("0.50", 18),
            3100, // > 3000
            300, 120
          )
        ).to.be.revertedWithCustomError(pool, "BadParams");
      });
    });

    describe("View Functions", () => {
      beforeEach(async () => {
        const amount = ethers.parseUnits("1000", 18);
        await usdt.connect(depositor1).approve(await pool.getAddress(), amount);
        await pool.connect(depositor1).deposit(amount);
      });

      it("cash() returns correct balance", async () => {
        const expectedCash = ethers.parseUnits("1000", 18);
        expect(await pool.cash()).to.equal(expectedCash);
      });

      it("totalDebt() returns zero with no borrows", async () => {
        expect(await pool.totalDebt()).to.equal(0);
      });

      it("utilizationWad() returns zero with no borrows", async () => {
        expect(await pool.utilizationWad()).to.equal(0);
      });

      it("utilizationWad() calculates correctly with borrows", async () => {
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit: ethers.parseUnits("500", 18) });
        await pool.connect(borrower1).borrow(ethers.parseUnits("400", 18));
        
        const util = await pool.utilizationWad();
        // util = debt / (cash + debt) = 400 / 1000 = 0.4 = 0.4e18
        expect(util).to.be.closeTo(ethers.parseUnits("0.4", 18), ethers.parseUnits("0.01", 18));
      });

      it("availableCredit() returns correct amount", async () => {
        const limit = ethers.parseUnits("500", 18);
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit });
        
        expect(await pool.availableCredit(borrower1.address)).to.equal(limit);
        
        await pool.connect(borrower1).borrow(ethers.parseUnits("200", 18));
        expect(await pool.availableCredit(borrower1.address)).to.be.closeTo(
          ethers.parseUnits("300", 18),
          ethers.parseUnits("1", 18)
        );
      });

      it("userInterestDue() calculates correctly", async () => {
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit: ethers.parseUnits("500", 18) });
        await pool.connect(borrower1).borrow(ethers.parseUnits("100", 18));
        
        expect(await pool.userInterestDue(borrower1.address)).to.equal(0);
        
        await timeTravel(3600);
        await pool.accrue();
        
        expect(await pool.userInterestDue(borrower1.address)).to.be.gt(0);
      });
    });

    describe("Multi-user Scenarios", () => {
      beforeEach(async () => {
        // Two depositors
        await usdt.connect(depositor1).approve(await pool.getAddress(), ethers.parseUnits("5000", 18));
        await pool.connect(depositor1).deposit(ethers.parseUnits("5000", 18));
        
        await usdt.connect(depositor2).approve(await pool.getAddress(), ethers.parseUnits("3000", 18));
        await pool.connect(depositor2).deposit(ethers.parseUnits("3000", 18));
      });

      it("handles multiple borrowers", async () => {
        await setBorrowerLimit({ borrower: borrower1, score: 850, limit: ethers.parseUnits("1000", 18) });
        await setBorrowerLimit({ borrower: borrower2, score: 900, limit: ethers.parseUnits("1500", 18) });
        
        await pool.connect(borrower1).borrow(ethers.parseUnits("800", 18));
        await pool.connect(borrower2).borrow(ethers.parseUnits("1200", 18));
        
        expect(await pool.userPrincipal(borrower1.address)).to.equal(ethers.parseUnits("800", 18));
        expect(await pool.userPrincipal(borrower2.address)).to.equal(ethers.parseUnits("1200", 18));
        expect(await pool.totalPrincipal()).to.equal(ethers.parseUnits("2000", 18));
      });

      it("multiple depositors share returns proportionally", async () => {
        const shares1Before = await pool.sharesOf(depositor1.address);
        const shares2Before = await pool.sharesOf(depositor2.address);
        
        // Ratio should be 5000:3000 = 5:3
        const ratio = (shares1Before * 1000n) / shares2Before;
        expect(ratio).to.be.closeTo(1666n, 10n); // 5/3 ≈ 1.666
      });
    });

    describe("Partial Repayments", () => {
      beforeEach(async () => {
        await usdt.connect(depositor1).approve(await pool.getAddress(), ethers.parseUnits("5000", 18));
        await pool.connect(depositor1).deposit(ethers.parseUnits("5000", 18));
        
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit: ethers.parseUnits("1000", 18) });
        await pool.connect(borrower1).borrow(ethers.parseUnits("500", 18));
        
        await timeTravel(1800);
        await pool.accrue();
      });

      it("allows partial repayment of principal", async () => {
        const partialPayment = ethers.parseUnits("200", 18);
        await usdt.connect(borrower1).approve(await pool.getAddress(), partialPayment);
        
        const debtBefore = await pool.userTotalDebt(borrower1.address);
        await pool.connect(borrower1).repay(partialPayment);
        const debtAfter = await pool.userTotalDebt(borrower1.address);
        
        expect(debtAfter).to.be.lt(debtBefore);
        expect(await pool.dueAt(borrower1.address)).to.be.gt(0); // Still has due date
      });

      it("interest is paid before principal", async () => {
        const interestDue = await pool.userInterestDue(borrower1.address);
        const principalBefore = await pool.userPrincipal(borrower1.address);
        
        // Pay less than interest
        const smallPayment = interestDue / 2n;
        await usdt.connect(borrower1).approve(await pool.getAddress(), smallPayment);
        await pool.connect(borrower1).repay(smallPayment);
        
        // Principal should remain unchanged
        expect(await pool.userPrincipal(borrower1.address)).to.equal(principalBefore);
      });
    });

    describe("Reserve Fund Mechanics", () => {
      it("reserve grows with interest repayments", async () => {
        await usdt.connect(depositor1).approve(await pool.getAddress(), ethers.parseUnits("5000", 18));
        await pool.connect(depositor1).deposit(ethers.parseUnits("5000", 18));
        
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit: ethers.parseUnits("1000", 18) });
        await pool.connect(borrower1).borrow(ethers.parseUnits("500", 18));
        
        await timeTravel(3600);
        await pool.accrue();
        
        const reserveBefore = await pool.reserveBalance();
        const due = await pool.userTotalDebt(borrower1.address);
        
        await usdt.connect(borrower1).approve(await pool.getAddress(), due);
        await pool.connect(borrower1).repay(due);
        
        const reserveAfter = await pool.reserveBalance();
        expect(reserveAfter).to.be.gt(reserveBefore);
      });

      it("reserve cannot be withdrawn by LPs", async () => {
        await usdt.connect(depositor1).approve(await pool.getAddress(), ethers.parseUnits("1000", 18));
        await pool.connect(depositor1).deposit(ethers.parseUnits("1000", 18));
        
        // Manually set reserve for testing
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit: ethers.parseUnits("500", 18) });
        await pool.connect(borrower1).borrow(ethers.parseUnits("300", 18));
        await timeTravel(3600);
        await pool.accrue();
        
        const due = await pool.userTotalDebt(borrower1.address);
        await usdt.connect(borrower1).approve(await pool.getAddress(), due);
        await pool.connect(borrower1).repay(due);
        
        const reserve = await pool.reserveBalance();
        const shares = await pool.sharesOf(depositor1.address);
        const withdrawable = await pool.sharesToAssets(shares);
        const cash = await pool.cash();
        
        // Reserve should be positive (some interest went to reserve)
        expect(reserve).to.be.gt(0);
        
        // Withdrawable should be approximately cash - reserve (allow small rounding tolerance)
        const maxWithdrawable = cash - reserve;
        const tolerance = ethers.parseUnits("0.01", 18); // 0.01 USDT tolerance
        expect(withdrawable).to.be.lte(maxWithdrawable + tolerance);
      });
    });

    describe("Edge Cases", () => {
      it("rejects zero amount deposit", async () => {
        await expect(pool.connect(depositor1).deposit(0))
          .to.be.revertedWithCustomError(pool, "ZeroAmount");
      });

      it("rejects zero amount withdrawal", async () => {
        await expect(pool.connect(depositor1).withdraw(0))
          .to.be.revertedWithCustomError(pool, "ZeroAmount");
      });

      it("rejects zero amount borrow", async () => {
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit: ethers.parseUnits("1000", 18) });
        await expect(pool.connect(borrower1).borrow(0))
          .to.be.revertedWithCustomError(pool, "ZeroAmount");
      });

      it("rejects zero amount repay", async () => {
        await expect(pool.connect(borrower1).repay(0))
          .to.be.revertedWithCustomError(pool, "ZeroAmount");
      });

      it("rejects borrow with expired credit", async () => {
        await usdt.connect(depositor1).approve(await pool.getAddress(), ethers.parseUnits("5000", 18));
        await pool.connect(depositor1).deposit(ethers.parseUnits("5000", 18));
        
        await setBorrowerLimit({ borrower: borrower1, score: 900, limit: ethers.parseUnits("1000", 18), ttlSeconds: 60 });
        
        await timeTravel(120); // Wait for expiry
        
        await expect(pool.connect(borrower1).borrow(ethers.parseUnits("100", 18)))
          .to.be.revertedWithCustomError(pool, "LimitInvalid");
      });

      it("handles first deposit correctly (share ratio 1:1)", async () => {
        const amount = ethers.parseUnits("1000", 18);
        await usdt.connect(depositor1).approve(await pool.getAddress(), amount);
        await pool.connect(depositor1).deposit(amount);
        
        expect(await pool.sharesOf(depositor1.address)).to.equal(amount);
      });
    });
  });
});
