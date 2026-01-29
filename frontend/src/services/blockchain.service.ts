import { ethers } from 'ethers';
import { 
  BLOCKCHAIN_CONFIG, 
  CREDIT_REGISTRY_ABI, 
  CREDORA_POOL_ABI, 
  MOCK_USDT_ABI 
} from '@/lib/constants';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Connect to MetaMask
   */
  async connectWallet(): Promise<{ address: string; provider: ethers.BrowserProvider }> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      // Check if correct network
      const network = await this.provider.getNetwork();
      if (network.chainId !== BigInt(BLOCKCHAIN_CONFIG.CHAIN_ID)) {
        // Try to switch to Hardhat network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${BLOCKCHAIN_CONFIG.CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          // Network doesn't exist, add it
          if (switchError && typeof switchError === 'object' && 'code' in switchError && (switchError as { code: number }).code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${BLOCKCHAIN_CONFIG.CHAIN_ID.toString(16)}`,
                chainName: 'Hardhat Local',
                rpcUrls: [BLOCKCHAIN_CONFIG.RPC_URL],
              }],
            });
          }
        }
      }

      return { address, provider: this.provider };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  /**
   * Sign message for authentication
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Get credit limit from CreditRegistry contract
   */
  async getCreditLimit(studentAddress: string): Promise<{
    score: number;
    limit: string;
    validUntil: Date;
  }> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDIT_REGISTRY_ADDRESS,
      CREDIT_REGISTRY_ABI,
      provider
    );

    try {
      const [limit, expiry] = await contract.getCreditLimit(studentAddress);
      const score = await contract.scoreOf(studentAddress);
      
      return {
        score: Number(score),
        limit: ethers.formatUnits(limit, 18),
        validUntil: new Date(Number(expiry) * 1000),
      };
    } catch (error) {
      console.error('Failed to get credit limit:', error);
      throw error;
    }
  }

  /**
   * Get pool statistics from CredoraPool contract
   */
  async getPoolStats(): Promise<{
    totalLiquidity: string;
    totalBorrowed: string;
    totalShares: string;
    utilizationRate: number;
  }> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
      CREDORA_POOL_ABI,
      provider
    );

    try {
      const [liquidity, borrowed, shares] = await Promise.all([
        contract.totalLiquidity(),
        contract.totalBorrowed(),
        contract.totalShares(),
      ]);

      const liquidityNum = Number(ethers.formatUnits(liquidity, 18));
      const borrowedNum = Number(ethers.formatUnits(borrowed, 18));
      const utilizationRate = liquidityNum > 0 ? (borrowedNum / liquidityNum) * 100 : 0;

      return {
        totalLiquidity: ethers.formatUnits(liquidity, 18),
        totalBorrowed: ethers.formatUnits(borrowed, 18),
        totalShares: ethers.formatUnits(shares, 18),
        utilizationRate,
      };
    } catch (error) {
      console.error('Failed to get pool stats:', error);
      throw error;
    }
  }

  /**
   * Get borrower debt from CredoraPool
   */
  async getBorrowerDebt(borrowerAddress: string): Promise<{
    principal: string;
    interest: string;
    shares: string;
  }> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
      CREDORA_POOL_ABI,
      provider
    );

    try {
      const [principal, interest, shares] = await contract.getBorrowerDebt(borrowerAddress);
      
      return {
        principal: ethers.formatUnits(principal, 18),
        interest: ethers.formatUnits(interest, 18),
        shares: ethers.formatUnits(shares, 18),
      };
    } catch (error) {
      console.error('Failed to get borrower debt:', error);
      throw error;
    }
  }

  /**
   * Get USDT balance
   */
  async getUSDTBalance(address: string): Promise<string> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.MOCK_USDT_ADDRESS,
      MOCK_USDT_ABI,
      provider
    );

    try {
      const balance = await contract.balanceOf(address);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error('Failed to get USDT balance:', error);
      throw error;
    }
  }

  /**
   * Get EMI schedule from CredoraPool (on-chain) - TIER 1 FIX #2
   */
  async getEMISchedule(borrowerAddress: string): Promise<{
    principal: string;
    interestRateBps: number;
    totalSlices: number;
    monthlyPayment: string;
    startDate: Date;
  } | null> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
      [
        'function emiSchedules(address) view returns (uint256 principal, uint256 interestRateBps, uint256 totalSlices, uint256 monthlyPayment, uint256 startDate)'
      ],
      provider
    );

    try {
      const schedule = await contract.emiSchedules(borrowerAddress);
      
      // If principal is 0, no active loan
      if (schedule.principal.toString() === '0') {
        return null;
      }

      return {
        principal: ethers.formatUnits(schedule.principal, 6),
        interestRateBps: Number(schedule.interestRateBps),
        totalSlices: Number(schedule.totalSlices),
        monthlyPayment: ethers.formatUnits(schedule.monthlyPayment, 6),
        startDate: new Date(Number(schedule.startDate) * 1000),
      };
    } catch (error) {
      console.error('Failed to get EMI schedule:', error);
      return null;
    }
  }

  /**
   * Check if a specific slice is paid (on-chain verification) - TIER 1 FIX #3
   */
  async isSlicePaid(borrowerAddress: string, sliceNumber: number): Promise<boolean> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
      [
        'function isSlicePaid(address borrower, uint256 sliceNumber) view returns (bool)'
      ],
      provider
    );

    try {
      return await contract.isSlicePaid(borrowerAddress, sliceNumber);
    } catch (error) {
      console.error('Failed to check slice payment status:', error);
      return false;
    }
  }

  /**
   * Get loan details from CredoraPool - TIER 1 FIX #5
   */
  async getLoanDetails(borrowerAddress: string): Promise<{
    amount: string;
    startDate: Date;
    maturityDate: Date;
    paidAmount: string;
    isActive: boolean;
    isDefaulted: boolean;
  } | null> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
      [
        'function loanDetails(address) view returns (uint256 amount, uint256 startDate, uint256 maturityDate, uint256 paidAmount, bool isActive, bool isDefaulted)'
      ],
      provider
    );

    try {
      const details = await contract.loanDetails(borrowerAddress);
      
      if (!details.isActive && details.amount.toString() === '0') {
        return null;
      }

      return {
        amount: ethers.formatUnits(details.amount, 6),
        startDate: new Date(Number(details.startDate) * 1000),
        maturityDate: new Date(Number(details.maturityDate) * 1000),
        paidAmount: ethers.formatUnits(details.paidAmount, 6),
        isActive: details.isActive,
        isDefaulted: details.isDefaulted,
      };
    } catch (error) {
      console.error('Failed to get loan details:', error);
      return null;
    }
  }

  /**
   * Register credit limit on-chain in CreditRegistry
   */
  async registerCreditOnChain(attestationData: {
    user: string;
    score: number;
    creditLimit: string;
    expiry: number;
    nonce: number;
    signature: string;
  }): Promise<{ txHash: string }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDIT_REGISTRY_ADDRESS,
      [
        'function updateLimit(tuple(address user, uint256 score, uint256 creditLimit, uint256 expiry, uint256 nonce) u, bytes signature) external',
      ],
      this.signer
    );

    try {
      console.log('Attestation data received:', attestationData);
      
      const limitUpdate = {
        user: attestationData.user,
        score: attestationData.score,
        creditLimit: BigInt(attestationData.creditLimit), // Parse string to BigInt
        expiry: attestationData.expiry,
        nonce: attestationData.nonce,
      };
      
      console.log('Limit update to send:', limitUpdate);

      const tx = await contract.updateLimit(limitUpdate, attestationData.signature);
      await tx.wait();

      return {
        txHash: tx.hash,
      };
    } catch (error: unknown) {
      console.error('Failed to register credit on-chain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register credit limit on blockchain';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if user has valid credit in CreditRegistry
   */
  async checkCreditValidity(userAddress: string): Promise<{ isValid: boolean; limit: string; expiry: Date | null }> {
    // Always use a fresh provider if this.provider is not available
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    // Ensure contract address is valid
    if (!BLOCKCHAIN_CONFIG.CREDIT_REGISTRY_ADDRESS) {
      throw new Error('Credit Registry address not configured');
    }
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDIT_REGISTRY_ADDRESS,
      CREDIT_REGISTRY_ABI,
      provider
    );

    try {
      const isValid = await contract.isValid(userAddress);
      
      if (!isValid) {
        return {
          isValid: false,
          limit: '0',
          expiry: null,
        };
      }

      const [limit, expiry] = await contract.getCreditLimit(userAddress);
      
      return {
        isValid: true,
        limit: ethers.formatUnits(limit, 18),
        expiry: new Date(Number(expiry) * 1000),
      };
    } catch (error) {
      console.error('Failed to check credit validity:', error);
      return {
        isValid: false,
        limit: '0',
        expiry: null,
      };
    }
  }

  /**
   * Borrow funds from CredoraPool
   */
  async borrowFunds(amount: string): Promise<{ txHash: string; amount: string }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const userAddress = await this.signer.getAddress();

    // Check if user has valid credit limit
    const creditCheck = await this.checkCreditValidity(userAddress);
    if (!creditCheck.isValid) {
      throw new Error('No valid credit limit found. Please complete onboarding and submit for credit scoring first.');
    }

    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
      CREDORA_POOL_ABI,
      this.signer
    );

    try {
      const amountWei = ethers.parseUnits(amount, 18);
      const tx = await contract.borrow(amountWei);
      await tx.wait();

      return {
        txHash: tx.hash,
        amount: amount,
      };
    } catch (error: unknown) {
      console.error('Failed to borrow funds:', error);
      
      // Decode custom errors
      if (error && typeof error === 'object' && 'data' in error && typeof error.data === 'string') {
        const errorCode = error.data.slice(0, 10);
        switch (errorCode) {
          case '0x487e4c08': // LimitInvalid()
            throw new Error('Credit limit invalid or expired. Please complete onboarding and credit scoring.');
          case '0xfb3fc856': // CreditExceeded()
            throw new Error('Borrow amount exceeds your available credit limit.');
          case '0xbb55fd27': // InsufficientLiquidity()
            throw new Error('Pool does not have enough liquidity for this borrow amount.');
          case '0x1f2a2005': // ZeroAmount()
            throw new Error('Borrow amount cannot be zero.');
          case '0x44a8bc55': // BorrowPaused()
            throw new Error('Borrowing is currently paused by admin.');
          case '0x8e4a23d6': // Blacklisted()
            throw new Error('Your account has been blacklisted due to defaults. Please contact support.');
          case '0x7c214f04': // PersonalLimitExceeded()
            throw new Error('Borrow amount exceeds personal borrowing limit of $10,000.');
          case '0x45c8b1a4': // DailyLimitExceeded()
            throw new Error('Daily platform borrowing limit reached. Please try again tomorrow.');
          case '0x2d0a3f8e': // MaxUtilizationExceeded()
            throw new Error('Pool utilization is too high. Please try a smaller amount or wait for more liquidity.');
          default: {
            const msg = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Transaction failed';
            throw new Error(msg);
          }
        }
      }
      
      throw error instanceof Error ? error : new Error('Transaction failed');
    }
  }

  /**
   * Repay loan to CredoraPool
   */
  async repayLoan(amount: string): Promise<{ txHash: string; amount: string }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // First approve USDT spending
      const usdtContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.MOCK_USDT_ADDRESS,
        MOCK_USDT_ABI,
        this.signer
      );

      const amountWei = ethers.parseUnits(amount, 18);
      
      // Approve CredoraPool to spend USDT
      const approveTx = await usdtContract.approve(
        BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
        amountWei
      );
      await approveTx.wait();

      // Then call repay
      const poolContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
        CREDORA_POOL_ABI,
        this.signer
      );

      const repayTx = await poolContract.repay(amountWei);
      await repayTx.wait();

      return {
        txHash: repayTx.hash,
        amount: amount,
      };
    } catch (error) {
      console.error('Failed to repay loan:', error);
      throw error;
    }
  }

  /**
   * Pay individual slice (EMI installment) using on-chain paySlice function
   */
  async paySlice(sliceNumber: number): Promise<{ txHash: string; amount: string }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const userAddress = await this.signer.getAddress();

    // Get EMI schedule to know payment amount
    const schedule = await this.getEMISchedule(userAddress);
    if (!schedule) {
      throw new Error('No active loan found');
    }

    try {
      // First approve USDT spending for exact EMI amount
      const usdtContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.MOCK_USDT_ADDRESS,
        MOCK_USDT_ABI,
        this.signer
      );

      const paymentAmount = ethers.parseUnits(schedule.monthlyPayment, 6);
      
      // Approve CredoraPool to spend exact EMI amount
      const approveTx = await usdtContract.approve(
        BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
        paymentAmount
      );
      await approveTx.wait();

      // Call paySlice with slice number (amount is enforced on-chain)
      const poolContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
        [
          'function paySlice(uint256 sliceNumber) external'
        ],
        this.signer
      );

      const paySliceTx = await poolContract.paySlice(sliceNumber);
      await paySliceTx.wait();

      return {
        txHash: paySliceTx.hash,
        amount: schedule.monthlyPayment,
      };
    } catch (error) {
      console.error('Failed to pay slice:', error);
      
      // Handle specific slice payment errors
      if (error && typeof error === 'object' && 'data' in error && typeof error.data === 'string') {
        const errorCode = error.data.slice(0, 10);
        if (errorCode === '0x9bca0625') { // SliceNotInOrder()
          throw new Error('Slices must be paid in sequential order. Please pay the next due slice.');
        }
        if (errorCode === '0x5c5c9f52') { // LoanMatured()
          throw new Error('Loan has matured and is overdue. Please contact support.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if wallet is currently connected
   */
  isWalletConnected(): boolean {
    return this.signer !== null;
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.provider = null;
    this.signer = null;
  }
}

export default new BlockchainService();
