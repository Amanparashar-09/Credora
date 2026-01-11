import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONTRACT_CONFIG } from '../config/contracts';
import CreditRegistryABI from '../abis/CreditRegistry.json';
import CredoraPoolABI from '../abis/CredoraPool.json';
import MockUSDTABI from '../abis/MockUSDT.json';

const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.RPC_URL);

// Contract instances
const creditRegistry = new ethers.Contract(
  CONTRACT_CONFIG.CREDIT_REGISTRY,
  CreditRegistryABI,
  provider
);

const credoraPool = new ethers.Contract(
  CONTRACT_CONFIG.CREDORA_POOL,
  CredoraPoolABI,
  provider
);

const mockUSDT = new ethers.Contract(
  CONTRACT_CONFIG.MOCK_USDT,
  MockUSDTABI,
  provider
);

export const blockchainService = {
  /**
   * Get credit limit for a student from CreditRegistry
   */
  async getCreditLimit(studentAddress: string): Promise<{
    score: number;
    limit: string;
    validUntil: Date;
    nonce: number;
  }> {
    try {
      const [score, limit, validUntil, nonce] = await creditRegistry.getCreditLimit(studentAddress);

      return {
        score: Number(score),
        limit: ethers.formatUnits(limit, 18),
        validUntil: new Date(Number(validUntil) * 1000),
        nonce: Number(nonce),
      };
    } catch (error: any) {
      logger.error('Failed to get credit limit:', error.message);
      throw new Error('Blockchain read failed');
    }
  },

  /**
   * Get pool statistics from CredoraPool
   */
  async getPoolStats(): Promise<{
    totalLiquidity: string;
    totalBorrowed: string;
    totalShares: string;
    utilizationRate: number;
    currentInterestRate: string;
  }> {
    try {
      logger.info(`Fetching pool stats from: ${CONTRACT_CONFIG.CREDORA_POOL}`);
      logger.info(`RPC URL: ${CONTRACT_CONFIG.RPC_URL}`);
      
      const [liquidity, borrowed, shares] = await Promise.all([
        credoraPool.totalLiquidity(),
        credoraPool.totalBorrowed(),
        credoraPool.totalShares(),
      ]);

      const liquidityNum = Number(ethers.formatUnits(liquidity, 18));
      const borrowedNum = Number(ethers.formatUnits(borrowed, 18));
      const utilizationRate = liquidityNum > 0 ? (borrowedNum / liquidityNum) * 100 : 0;

      // Calculate current interest rate based on utilization
      let interestRate: number;
      const util = utilizationRate / 100;
      if (util <= 0.8) {
        interestRate = 0.02 + (util / 0.8) * 0.08; // 2% to 10%
      } else {
        interestRate = 0.10 + ((util - 0.8) / 0.2) * 0.40; // 10% to 50%
      }

      const result = {
        totalLiquidity: ethers.formatUnits(liquidity, 18),
        totalBorrowed: ethers.formatUnits(borrowed, 18),
        totalShares: ethers.formatUnits(shares, 18),
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        currentInterestRate: (interestRate * 100).toFixed(2) + '%',
      };
      
      logger.info(`Pool stats result:`, result);
      
      return result;
    } catch (error: any) {
      logger.error('Failed to get pool stats:', error.message);
      logger.error('Error stack:', error.stack);
      // Return default values for new/empty pool
      return {
        totalLiquidity: '0',
        totalBorrowed: '0',
        totalShares: '0',
        utilizationRate: 0,
        currentInterestRate: '2.00%',
      };
    }
  },

  /**
   * Get borrower's debt information
   */
  async getBorrowerDebt(borrowerAddress: string): Promise<{
    principal: string;
    debt: string;
    dueAt: Date | null;
    isDefaulted: boolean;
  }> {
    try {
      const [principal, debt, dueAt] = await credoraPool.getBorrowerDebt(borrowerAddress);

      const dueDate = Number(dueAt) > 0 ? new Date(Number(dueAt) * 1000) : null;
      const now = Math.floor(Date.now() / 1000);
      const isDefaulted = dueDate !== null && Number(dueAt) < now;

      return {
        principal: ethers.formatUnits(principal, 18),
        debt: ethers.formatUnits(debt, 18),
        dueAt: dueDate,
        isDefaulted,
      };
    } catch (error: any) {
      logger.error('Failed to get borrower debt:', error.message);
      // Return zero debt for new users who don't exist in contract yet
      return {
        principal: '0',
        debt: '0',
        dueAt: null,
        isDefaulted: false,
      };
    }
  },

  /**
   * Get investor's shares and balance
   */
  async getInvestorBalance(investorAddress: string): Promise<{
    shares: string;
    withdrawableAmount: string;
  }> {
    try {
      logger.info(`Fetching balance for investor: ${investorAddress}`);
      logger.info(`Pool contract address: ${CONTRACT_CONFIG.CREDORA_POOL}`);
      logger.info(`RPC URL: ${CONTRACT_CONFIG.RPC_URL}`);
      
      const shares = await credoraPool.balanceOf(investorAddress);
      const withdrawable = await credoraPool.previewWithdraw(shares);

      const result = {
        shares: ethers.formatUnits(shares, 18),
        withdrawableAmount: ethers.formatUnits(withdrawable, 18),
      };
      
      logger.info(`Investor balance result:`, result);
      
      return result;
    } catch (error: any) {
      logger.error('Failed to get investor balance:', error.message);
      logger.error('Error stack:', error.stack);
      // Return zero balance for new investors
      return {
        shares: '0',
        withdrawableAmount: '0',
      };
    }
  },

  /**
   * Get USDT balance
   */
  async getUSDTBalance(address: string): Promise<string> {
    try {
      const balance = await mockUSDT.balanceOf(address);
      return ethers.formatUnits(balance, 18);
    } catch (error: any) {
      logger.error('Failed to get USDT balance:', error.message);
      // Return zero balance for new addresses
      return '0';
    }
  },

  /**
   * Listen to contract events
   */
  setupEventListeners() {
    // Listen to Borrow events
    credoraPool.on('Borrowed', (borrower, amount, dueAt, event) => {
      logger.info('Borrow event detected', {
        borrower,
        amount: ethers.formatUnits(amount, 18),
        dueAt: new Date(Number(dueAt) * 1000),
        txHash: event.log.transactionHash,
      });
    });

    // Listen to Repay events
    credoraPool.on('Repaid', (borrower, amount, event) => {
      logger.info('Repay event detected', {
        borrower,
        amount: ethers.formatUnits(amount, 18),
        txHash: event.log.transactionHash,
      });
    });

    // Listen to Deposit events
    credoraPool.on('Deposited', (investor, amount, shares, event) => {
      logger.info('Deposit event detected', {
        investor,
        amount: ethers.formatUnits(amount, 18),
        shares: ethers.formatUnits(shares, 18),
        txHash: event.log.transactionHash,
      });
    });

    // Listen to Withdraw events
    credoraPool.on('Withdrawn', (investor, amount, shares, event) => {
      logger.info('Withdraw event detected', {
        investor,
        amount: ethers.formatUnits(amount, 18),
        shares: ethers.formatUnits(shares, 18),
        txHash: event.log.transactionHash,
      });
    });

    logger.info('Event listeners setup complete');
  },

  /**
   * Health check for blockchain connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const blockNumber = await provider.getBlockNumber();
      logger.debug('Blockchain health check passed', { blockNumber });
      return true;
    } catch (error) {
      logger.error('Blockchain health check failed');
      return false;
    }
  },
};
