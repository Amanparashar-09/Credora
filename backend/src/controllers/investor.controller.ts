import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Investor } from '../models/Investor';
import { Transaction } from '../models/Transaction';
import { NotFoundError, ValidationError } from '../utils/errors';
import { blockchainService } from '../services/blockchainService';

export const investorController = {
  /**
   * Get investor profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const investor = await Investor.findOne({ walletAddress: req.user!.address });
      
      if (!investor) {
        throw new NotFoundError('Investor profile not found');
      }

      res.json({
        success: true,
        data: {
          walletAddress: investor.walletAddress,
          email: investor.email,
          name: investor.name,
          investorType: investor.investorType,
          kycVerified: investor.kycVerified,
          totalDeposited: investor.totalDeposited,
          totalWithdrawn: investor.totalWithdrawn,
          currentBalance: investor.currentBalance,
          shareBalance: investor.shareBalance,
          totalInterestEarned: investor.totalInterestEarned,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update investor profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, name, investorType } = req.body;

      const investor = await Investor.findOneAndUpdate(
        { walletAddress: req.user!.address },
        {
          $set: {
            email,
            name,
            investorType,
            lastActive: new Date(),
          },
        },
        { new: true, runValidators: true }
      );

      if (!investor) {
        throw new NotFoundError('Investor profile not found');
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: investor,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get available pools
   */
  async getPools(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const poolStats = await blockchainService.getPoolStats();
      
      // Get investor's balance in the pool
      const investorBalance = await blockchainService.getInvestorBalance(req.user!.address);
      
      // Calculate APY from current interest rate (already formatted as percentage string like "2.00%")
      const apy = poolStats.currentInterestRate.replace('%', '');
      
      // Determine risk level based on utilization rate
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (poolStats.utilizationRate > 75) {
        riskLevel = 'High';
      } else if (poolStats.utilizationRate > 50) {
        riskLevel = 'Medium';
      }

      res.json({
        success: true,
        data: {
          pools: [
            {
              address: process.env.CREDORA_POOL_ADDRESS,
              name: 'Credora Main Pool',
              riskLevel,
              apy,
              totalLiquidity: poolStats.totalLiquidity,
              totalBorrowed: poolStats.totalBorrowed,
              utilizationRate: poolStats.utilizationRate,
              yourInvestment: investorBalance.withdrawableAmount, // Total value investor can withdraw
              studentsFunded: 0, // TODO: Track this in smart contract or database
            },
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Record investment transaction
   */
  async invest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, txHash, lockInMonths } = req.body;

      if (!amount || !txHash) {
        throw new ValidationError('Amount and transaction hash are required');
      }

      // Check if transaction already recorded
      const existingTx = await Transaction.findOne({ txHash });
      if (existingTx) {
        res.json({
          success: true,
          data: { message: 'Transaction already recorded' },
        });
        return;
      }

      const investor = await Investor.findOne({ walletAddress: req.user!.address });

      if (!investor) {
        throw new NotFoundError('Investor profile not found');
      }

      // Update investor totals
      const currentDeposited = parseFloat(investor.totalDeposited || '0');
      const depositAmount = parseFloat(amount);
      investor.totalDeposited = (currentDeposited + depositAmount).toString();
      investor.currentBalance = (parseFloat(investor.currentBalance || '0') + depositAmount).toString();

      // Add to active pools if not already there
      const poolAddress = process.env.CREDORA_POOL_ADDRESS!;
      const poolExists = investor.activePools.some(pool => pool.poolAddress === poolAddress);
      
      if (!poolExists) {
        investor.activePools.push({
          poolAddress: poolAddress,
          shares: '0', // Will be updated when we read from blockchain
          depositedAt: new Date(),
        });
      }

      await investor.save();

      // Record transaction with optional lock-in period
      const description = lockInMonths 
        ? `Deposited ${amount} USDT to Credora Main Pool (${lockInMonths} month lock-in)`
        : `Deposited ${amount} USDT to Credora Main Pool`;

      await Transaction.create({
        walletAddress: req.user!.address,
        type: 'deposit',
        amount: amount,
        txHash: txHash,
        poolAddress: poolAddress,
        description,
        status: 'completed',
      });

      res.json({
        success: true,
        data: {
          message: 'Investment recorded successfully',
          amount: amount,
          txHash: txHash,
          totalDeposited: investor.totalDeposited,
          lockInMonths: lockInMonths || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Record withdrawal transaction
   */
  async withdraw(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, txHash } = req.body;

      if (!amount || !txHash) {
        throw new ValidationError('Amount and transaction hash are required');
      }

      // Check if transaction already recorded
      const existingTx = await Transaction.findOne({ txHash });
      if (existingTx) {
        res.json({
          success: true,
          data: { message: 'Transaction already recorded' },
        });
        return;
      }

      const investor = await Investor.findOne({ walletAddress: req.user!.address });

      if (!investor) {
        throw new NotFoundError('Investor profile not found');
      }

      // Update investor totals
      const currentWithdrawn = parseFloat(investor.totalWithdrawn || '0');
      const withdrawAmount = parseFloat(amount);
      investor.totalWithdrawn = (currentWithdrawn + withdrawAmount).toString();
      investor.currentBalance = (parseFloat(investor.currentBalance || '0') - withdrawAmount).toString();

      await investor.save();

      // Record transaction
      const poolAddress = process.env.CREDORA_POOL_ADDRESS!;
      await Transaction.create({
        walletAddress: req.user!.address,
        type: 'withdrawal',
        amount: amount,
        txHash: txHash,
        poolAddress: poolAddress,
        description: `Withdrew ${amount} USDT from Credora Main Pool`,
        status: 'completed',
      });

      res.json({
        success: true,
        data: {
          message: 'Withdrawal recorded successfully',
          amount: amount,
          txHash: txHash,
          totalWithdrawn: investor.totalWithdrawn,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get specific pool stats
   */
  async getPoolStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const poolStats = await blockchainService.getPoolStats();

      res.json({
        success: true,
        data: poolStats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get investor portfolio
   */
  async getPortfolio(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const investor = await Investor.findOne({ walletAddress: req.user!.address });
      const balance = await blockchainService.getInvestorBalance(req.user!.address);

      res.json({
        success: true,
        data: {
          shares: balance.shares,
          withdrawableAmount: balance.withdrawableAmount,
          activePools: investor?.activePools || [],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get investor balance
   */
  async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [poolBalance, usdtBalance] = await Promise.all([
        blockchainService.getInvestorBalance(req.user!.address),
        blockchainService.getUSDTBalance(req.user!.address),
      ]);

      res.json({
        success: true,
        data: {
          usdtBalance: usdtBalance,
          totalShares: poolBalance.shares,
          portfolioValue: poolBalance.withdrawableAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get returns/earnings
   */
  async getReturns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const investor = await Investor.findOne({ walletAddress: req.user!.address });
      const balance = await blockchainService.getInvestorBalance(req.user!.address);

      // Calculate total deposited from actual transactions (more accurate)
      const transactions = await Transaction.find({ 
        walletAddress: req.user!.address,
        status: 'completed'
      });

      let totalDeposited = 0;
      let totalWithdrawn = 0;

      transactions.forEach(tx => {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'deposit') {
          totalDeposited += amount;
        } else if (tx.type === 'withdrawal') {
          totalWithdrawn += amount;
        }
      });

      const currentValue = parseFloat(balance.withdrawableAmount);
      const returns = currentValue - totalDeposited;
      const returnPercentage = totalDeposited > 0 ? (returns / totalDeposited) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalDeposited: totalDeposited.toFixed(6),
          currentValue: balance.withdrawableAmount,
          totalReturns: returns.toFixed(6),
          returnPercentage: returnPercentage.toFixed(2) + '%',
          interestEarned: investor?.totalInterestEarned || '0',
          totalWithdrawn: totalWithdrawn.toFixed(6),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get analytics
   */
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [poolStats, investorBalance] = await Promise.all([
        blockchainService.getPoolStats(),
        blockchainService.getInvestorBalance(req.user!.address),
      ]);

      const investorShares = parseFloat(investorBalance.shares);
      const totalShares = parseFloat(poolStats.totalShares);
      
      const poolOwnership = totalShares > 0 ? (investorShares / totalShares) * 100 : 0;
      const utilizationRate = typeof poolStats.utilizationRate === 'string' 
        ? parseFloat(poolStats.utilizationRate) 
        : poolStats.utilizationRate;

      res.json({
        success: true,
        data: {
          pool: poolStats,
          investor: {
            shares: investorBalance.shares,
            withdrawable: investorBalance.withdrawableAmount,
            poolOwnership: poolOwnership.toFixed(4) + '%',
          },
          projections: {
            estimatedAnnualReturn: poolStats.currentInterestRate,
            riskLevel: utilizationRate > 85 ? 'high' : 
                       utilizationRate > 70 ? 'medium' : 'low',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get dashboard data
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [investor, balance, usdtBalance, poolStats, recentTransactions] = await Promise.all([
        Investor.findOne({ walletAddress: req.user!.address }),
        blockchainService.getInvestorBalance(req.user!.address),
        blockchainService.getUSDTBalance(req.user!.address),
        blockchainService.getPoolStats(),
        Transaction.find({ walletAddress: req.user!.address })
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

      // Calculate total deposited from actual transactions (more accurate)
      const allTransactions = await Transaction.find({ 
        walletAddress: req.user!.address,
        status: 'completed'
      });

      let totalDeposited = 0;
      let totalWithdrawn = 0;

      allTransactions.forEach(tx => {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'deposit') {
          totalDeposited += amount;
        } else if (tx.type === 'withdrawal') {
          totalWithdrawn += amount;
        }
      });

      const withdrawableAmount = parseFloat(balance.withdrawableAmount || '0');
      const totalReturns = withdrawableAmount - totalDeposited;
      const returnPercentage = totalDeposited > 0 ? ((totalReturns / totalDeposited) * 100).toFixed(2) : '0';

      // Calculate monthly average returns (simplified)
      const monthlyAverage = totalReturns > 0 ? (totalReturns / 12).toFixed(2) : '0';

      // Calculate next payout (15 days from now as example)
      const nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 15);
      const daysUntilPayout = 15;

      // Estimated next payout based on current APY
      const apy = parseFloat(poolStats.currentInterestRate.replace('%', '')) / 100;
      const monthlyRate = apy / 12;
      const estimatedNextPayout = (withdrawableAmount * monthlyRate).toFixed(2);

      // Portfolio pools data
      const pools = investor?.activePools.map(pool => ({
        poolAddress: pool.poolAddress,
        poolName: 'Credora Main Pool',
        shares: balance.shares,
        currentValue: balance.withdrawableAmount,
        depositedAt: pool.depositedAt,
      })) || [];

      // Format recent activity
      const recentActivity = recentTransactions.map(tx => {
        const amount = parseFloat(tx.amount);
        let type: 'deposit' | 'withdrawal' | 'return';
        let description = tx.description;

        if (tx.type === 'deposit') {
          type = 'deposit';
        } else if (tx.type === 'withdrawal') {
          type = 'withdrawal';
        } else {
          type = 'return';
        }

        return {
          id: tx._id.toString(),
          type,
          description,
          amount,
          date: tx.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          txHash: tx.txHash,
        };
      });

      res.json({
        success: true,
        data: {
          profile: {
            name: investor?.name,
            investorType: investor?.investorType,
            kycVerified: investor?.kycVerified,
          },
          balance: {
            usdtBalance: usdtBalance,
            totalShares: balance.shares,
            portfolioValue: balance.withdrawableAmount,
          },
          portfolio: {
            totalValue: balance.withdrawableAmount,
            invested: totalDeposited.toFixed(6),
            available: usdtBalance,
            apy: poolStats.currentInterestRate,
            pools: pools,
          },
          returns: {
            totalEarned: totalReturns.toFixed(2),
            monthlyAverage: monthlyAverage,
            withdrawable: balance.withdrawableAmount,
            returnPercentage: returnPercentage,
          },
          recentActivity: recentActivity,
          riskMetrics: {
            defaultRate: poolStats.utilizationRate > 80 ? '2.5' : poolStats.utilizationRate > 50 ? '1.5' : '1.2',
            avgLockIn: '6 months',
            nextPayout: {
              amount: estimatedNextPayout,
              daysUntil: daysUntilPayout,
              date: nextPayoutDate.toISOString(),
            },
            utilizationRate: poolStats.utilizationRate,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

