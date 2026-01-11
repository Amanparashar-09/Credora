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
   * Pay individual slice (EMI installment) - calls repay with slice amount
   */
  async paySlice(sliceAmount: string): Promise<{ txHash: string; amount: string }> {
    // Slice payment is just a repayment with specific amount
    return this.repayLoan(sliceAmount);
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
