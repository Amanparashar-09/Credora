// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const API_HEALTH_URL = 'http://localhost:5000/api/health';

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  RPC_URL: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
  CHAIN_ID: 31337, // Hardhat local
  CREDIT_REGISTRY_ADDRESS: import.meta.env.VITE_CREDIT_REGISTRY || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  CREDORA_POOL_ADDRESS: import.meta.env.VITE_CREDORA_POOL || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  MOCK_USDT_ADDRESS: import.meta.env.VITE_MOCK_USDT || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
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
