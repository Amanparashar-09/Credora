import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Investor } from '../models/Investor';
import { NotFoundError } from '../utils/errors';
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
  async getPools(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const poolStats = await blockchainService.getPoolStats();

      res.json({
        success: true,
        data: {
          pools: [
            {
              address: process.env.CREDORA_POOL_ADDRESS,
              name: 'Credora Main Pool',
              ...poolStats,
            },
          ],
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
          pool: poolBalance,
          wallet: {
            usdt: usdtBalance,
          },
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

      // Calculate approximate returns
      const totalDeposited = parseFloat(investor?.totalDeposited || '0');
      const currentValue = parseFloat(balance.withdrawableAmount);
      const returns = currentValue - totalDeposited;
      const returnPercentage = totalDeposited > 0 ? (returns / totalDeposited) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalDeposited: investor?.totalDeposited || '0',
          currentValue: balance.withdrawableAmount,
          totalReturns: returns.toFixed(6),
          returnPercentage: returnPercentage.toFixed(2) + '%',
          interestEarned: investor?.totalInterestEarned || '0',
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
      const [investor, poolStats, balance] = await Promise.all([
        Investor.findOne({ walletAddress: req.user!.address }),
        blockchainService.getPoolStats(),
        blockchainService.getInvestorBalance(req.user!.address),
      ]);

      const totalDeposited = parseFloat(investor?.totalDeposited || '0');
      const currentValue = parseFloat(balance.withdrawableAmount);
      const returns = currentValue - totalDeposited;

      res.json({
        success: true,
        data: {
          profile: {
            name: investor?.name,
            investorType: investor?.investorType,
            kycVerified: investor?.kycVerified,
          },
          investment: {
            totalDeposited: investor?.totalDeposited || '0',
            currentValue: balance.withdrawableAmount,
            shares: balance.shares,
            returns: returns.toFixed(6),
          },
          pool: {
            utilizationRate: poolStats.utilizationRate,
            currentInterestRate: poolStats.currentInterestRate,
            totalLiquidity: poolStats.totalLiquidity,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
