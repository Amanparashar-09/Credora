// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const API_HEALTH_URL = 'http://localhost:5000/api/health';

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://ethereum-hoodi-rpc.publicnode.com',
  CHAIN_ID: import.meta.env.VITE_CHAIN_ID ? parseInt(import.meta.env.VITE_CHAIN_ID) : 560048, // Hoodi Testnet
  CREDIT_REGISTRY_ADDRESS: import.meta.env.VITE_CREDIT_REGISTRY || '0x115b68577762498fD9e81d99b8089dd7e1700DEb',
  CREDORA_POOL_ADDRESS: import.meta.env.VITE_CREDORA_POOL || '0x747a64026082cb03C6902097C100E92CfA746006',
  MOCK_USDT_ADDRESS: import.meta.env.VITE_MOCK_USDT || '0x66A13f5e066622265646A7E0fF496C93dFc9a3cF',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'credora_auth_token',
  WALLET_ADDRESS: 'credora_wallet_address',
  USER_ROLE: 'credora_user_role',
};

// Contract ABIs (simplified - for reads only)
export const CREDIT_REGISTRY_ABI = [
  'function getCreditLimit(address) view returns (uint256 score, uint256 limit, uint256 validUntil, uint256 nonce)',
  'function isValid(address) view returns (bool)',
];

export const CREDORA_POOL_ABI = [
  'function totalLiquidity() view returns (uint256)',
  'function totalBorrowed() view returns (uint256)',
  'function totalShares() view returns (uint256)',
  'function getBorrowerDebt(address) view returns (uint256 principal, uint256 interest, uint256 shares)',
];

export const MOCK_USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address, address) view returns (uint256)',
];
