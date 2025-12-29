const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Credora Basic Tests", function () {
  let creditRegistry;
  let credoraPool;
  let owner;
  let student;
  let investor;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, student, investor, ...addrs] = await ethers.getSigners();

    // Deploy CreditRegistry
    const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
    creditRegistry = await CreditRegistry.deploy();
    await creditRegistry.waitForDeployment();

    // Deploy CredoraPool
    const CredoraPool = await ethers.getContractFactory("CredoraPool");
    credoraPool = await CredoraPool.deploy(await creditRegistry.getAddress());
    await credoraPool.waitForDeployment();

    // Authorize CredoraPool in CreditRegistry
    await creditRegistry.authorizePool(await credoraPool.getAddress(), true);
  });

  describe("CreditRegistry", function () {
    describe("Student Registration", function () {
      it("Should register a new student", async function () {
        await creditRegistry.connect(student).registerStudent();
        const profile = await creditRegistry.getCreditProfile(student.address);
        
        expect(profile.isActive).to.equal(true);
        expect(profile.creditScore).to.equal(500);
        expect(profile.student).to.equal(student.address);
      });

      it("Should not allow duplicate registration", async function () {
        await creditRegistry.connect(student).registerStudent();
        
        await expect(
          creditRegistry.connect(student).registerStudent()
        ).to.be.revertedWith("Student already registered");
      });

      it("Should increment total students count", async function () {
        await creditRegistry.connect(student).registerStudent();
        expect(await creditRegistry.totalStudents()).to.equal(1);
        
        await creditRegistry.connect(investor).registerStudent();
        expect(await creditRegistry.totalStudents()).to.equal(2);
      });
    });

    describe("Credit Score Management", function () {
      beforeEach(async function () {
        await creditRegistry.connect(student).registerStudent();
      });

      it("Should check eligibility for loan", async function () {
        const eligible = await creditRegistry.isEligibleForLoan(
          student.address,
          ethers.parseEther("10")
        );
        expect(eligible).to.equal(true);
      });

      it("Should calculate max loan amount based on credit score", async function () {
        const maxLoan = await creditRegistry.getMaxLoanAmount(student.address);
        expect(maxLoan).to.equal(ethers.parseEther("25000"));
      });
    });

    describe("Pool Authorization", function () {
      it("Should authorize a pool", async function () {
        const poolAddress = await credoraPool.getAddress();
        expect(await creditRegistry.authorizedPools(poolAddress)).to.equal(true);
      });

      it("Should only allow owner to authorize pools", async function () {
        await expect(
          creditRegistry.connect(student).authorizePool(student.address, true)
        ).to.be.revertedWith("Only owner can call this function");
      });
    });
  });

  describe("CredoraPool", function () {
    describe("Pool Creation", function () {
      it("Should create a new pool", async function () {
        const tx = await credoraPool.createPool(
          "Education Fund",
          500, // 5% interest
          ethers.parseEther("1"), // 1 ETH min investment
          ethers.parseEther("10"), // 10 ETH max loan
          30 * 24 * 60 * 60 // 30 days duration
        );

        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            return credoraPool.interface.parseLog(log).name === "PoolCreated";
          } catch {
            return false;
          }
        });

        expect(event).to.not.be.undefined;
        expect(await credoraPool.poolCount()).to.equal(1);
      });

      it("Should store correct pool details", async function () {
        await credoraPool.createPool(
          "Education Fund",
          500,
          ethers.parseEther("1"),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60
        );

        const pool = await credoraPool.getPool(1);
        expect(pool.name).to.equal("Education Fund");
        expect(pool.interestRate).to.equal(500);
        expect(pool.isActive).to.equal(true);
        expect(pool.creator).to.equal(owner.address);
      });
    });

    describe("Investment", function () {
      beforeEach(async function () {
        await credoraPool.createPool(
          "Education Fund",
          500,
          ethers.parseEther("1"),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60
        );
      });

      it("Should allow investors to invest in pool", async function () {
        const investmentAmount = ethers.parseEther("5");
        
        await credoraPool.connect(investor).invest(1, {
          value: investmentAmount
        });

        const pool = await credoraPool.getPool(1);
        expect(pool.totalFunds).to.equal(investmentAmount);
        expect(pool.availableFunds).to.equal(investmentAmount);
      });

      it("Should reject investment below minimum", async function () {
        await expect(
          credoraPool.connect(investor).invest(1, {
            value: ethers.parseEther("0.5")
          })
        ).to.be.revertedWith("Investment below minimum");
      });

      it("Should track investor investments", async function () {
        await credoraPool.connect(investor).invest(1, {
          value: ethers.parseEther("5")
        });

        const investments = await credoraPool.getInvestments(investor.address);
        expect(investments.length).to.equal(1);
        expect(investments[0].amount).to.equal(ethers.parseEther("5"));
      });
    });

    describe("Loan Management", function () {
      beforeEach(async function () {
        // Register student
        await creditRegistry.connect(student).registerStudent();
        
        // Create pool
        await credoraPool.createPool(
          "Education Fund",
          500,
          ethers.parseEther("1"),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60
        );
        
        // Add funds to pool
        await credoraPool.connect(investor).invest(1, {
          value: ethers.parseEther("20")
        });
      });

      it("Should allow eligible student to request loan", async function () {
        const loanAmount = ethers.parseEther("5");
        await credoraPool.connect(student).requestLoan(1, loanAmount);
        
        expect(await credoraPool.loanCount()).to.equal(1);
        const loan = await credoraPool.getLoan(1);
        expect(loan.borrower).to.equal(student.address);
        expect(loan.principal).to.equal(loanAmount);
      });

      it("Should calculate correct interest", async function () {
        const loanAmount = ethers.parseEther("10");
        await credoraPool.connect(student).requestLoan(1, loanAmount);
        
        const loan = await credoraPool.getLoan(1);
        const expectedInterest = ethers.parseEther("0.5"); // 5% of 10 ETH
        expect(loan.interest).to.equal(expectedInterest);
      });

      it("Should not allow loan exceeding pool max", async function () {
        await expect(
          credoraPool.connect(student).requestLoan(1, ethers.parseEther("15"))
        ).to.be.revertedWith("Amount exceeds pool limit");
      });

      it("Should not allow loan if insufficient pool funds", async function () {
        // Create a new pool with less funds
        await credoraPool.createPool(
          "Small Fund",
          500,
          ethers.parseEther("1"),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60
        );
        
        await credoraPool.connect(investor).invest(2, {
          value: ethers.parseEther("2")
        });

        await expect(
          credoraPool.connect(student).requestLoan(2, ethers.parseEther("5"))
        ).to.be.revertedWith("Insufficient pool funds");
      });
    });

    describe("Loan Approval and Disbursement", function () {
      beforeEach(async function () {
        await creditRegistry.connect(student).registerStudent();
        
        await credoraPool.createPool(
          "Education Fund",
          500,
          ethers.parseEther("1"),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60
        );
        
        await credoraPool.connect(investor).invest(1, {
          value: ethers.parseEther("20")
        });
        
        await credoraPool.connect(student).requestLoan(1, ethers.parseEther("5"));
      });

      it("Should allow owner to approve loan", async function () {
        const studentBalanceBefore = await ethers.provider.getBalance(student.address);
        
        await credoraPool.approveLoan(1);
        
        const studentBalanceAfter = await ethers.provider.getBalance(student.address);
        expect(studentBalanceAfter).to.be.gt(studentBalanceBefore);
      });

      it("Should reduce available pool funds after approval", async function () {
        const poolBefore = await credoraPool.getPool(1);
        await credoraPool.approveLoan(1);
        const poolAfter = await credoraPool.getPool(1);
        
        expect(poolAfter.availableFunds).to.equal(
          poolBefore.availableFunds - ethers.parseEther("5")
        );
      });

      it("Should only allow owner to approve loans", async function () {
        await expect(
          credoraPool.connect(student).approveLoan(1)
        ).to.be.revertedWith("Only owner can call this function");
      });
    });

    describe("Loan Repayment", function () {
      beforeEach(async function () {
        await creditRegistry.connect(student).registerStudent();
        
        await credoraPool.createPool(
          "Education Fund",
          500,
          ethers.parseEther("1"),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60
        );
        
        await credoraPool.connect(investor).invest(1, {
          value: ethers.parseEther("20")
        });
        
        await credoraPool.connect(student).requestLoan(1, ethers.parseEther("5"));
        await credoraPool.approveLoan(1);
      });

      it("Should allow borrower to repay loan", async function () {
        const repaymentAmount = ethers.parseEther("2");
        
        await credoraPool.connect(student).repayLoan(1, {
          value: repaymentAmount
        });
        
        const loan = await credoraPool.getLoan(1);
        expect(loan.amountRepaid).to.equal(repaymentAmount);
      });

      it("Should mark loan as inactive after full repayment", async function () {
        const loan = await credoraPool.getLoan(1);
        
        await credoraPool.connect(student).repayLoan(1, {
          value: loan.totalAmount
        });
        
        const updatedLoan = await credoraPool.getLoan(1);
        expect(updatedLoan.isActive).to.equal(false);
      });

      it("Should only allow borrower to repay their own loan", async function () {
        await expect(
          credoraPool.connect(investor).repayLoan(1, {
            value: ethers.parseEther("1")
          })
        ).to.be.revertedWith("Only borrower can repay");
      });
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete loan lifecycle", async function () {
      // Register student
      await creditRegistry.connect(student).registerStudent();
      
      // Create pool
      await credoraPool.createPool(
        "Education Fund",
        500,
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        30 * 24 * 60 * 60
      );
      
      // Invest in pool
      await credoraPool.connect(investor).invest(1, {
        value: ethers.parseEther("20")
      });
      
      // Request loan
      await credoraPool.connect(student).requestLoan(1, ethers.parseEther("5"));
      
      // Approve loan
      await credoraPool.approveLoan(1);
      
      // Check credit history
      const profileBefore = await creditRegistry.getCreditProfile(student.address);
      expect(profileBefore.totalBorrowed).to.equal(ethers.parseEther("5"));
      
      // Repay loan
      const loan = await credoraPool.getLoan(1);
      await credoraPool.connect(student).repayLoan(1, {
        value: loan.totalAmount
      });
      
      // Check final state
      const profileAfter = await creditRegistry.getCreditProfile(student.address);
      expect(profileAfter.totalRepaid).to.equal(loan.totalAmount);
      expect(profileAfter.creditScore).to.be.gt(profileBefore.creditScore);
    });
  });
});
