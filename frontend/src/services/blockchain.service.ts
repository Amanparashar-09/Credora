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
    nonce: number;
  }> {
    const provider = this.provider || new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CREDIT_REGISTRY_ADDRESS,
      CREDIT_REGISTRY_ABI,
      provider
    );

    try {
      const [score, limit, validUntil, nonce] = await contract.getCreditLimit(studentAddress);
      
      return {
        score: Number(score),
        limit: ethers.formatUnits(limit, 18),
        validUntil: new Date(Number(validUntil) * 1000),
        nonce: Number(nonce),
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
   * Disconnect wallet
   */
  disconnect(): void {
    this.provider = null;
    this.signer = null;
  }
}

export default new BlockchainService();
