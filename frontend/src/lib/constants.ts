// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const API_HEALTH_URL = 'http://localhost:5000/api/health';

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://ethereum-hoodi-rpc.publicnode.com',
  CHAIN_ID: import.meta.env.VITE_CHAIN_ID ? parseInt(import.meta.env.VITE_CHAIN_ID) : 560048, // Hoodi Testnet
  CREDIT_REGISTRY_ADDRESS: import.meta.env.VITE_CREDIT_REGISTRY_ADDRESS || '0xd18267b34e2664bc01fD7A36e457FF59cD24667B',
  CREDORA_POOL_ADDRESS: import.meta.env.VITE_CREDORA_POOL_ADDRESS || '0x8f82841452c870Add2A0DE3A8579e87662B8A537',
  MOCK_USDT_ADDRESS: import.meta.env.VITE_MOCK_USDT_ADDRESS || '0x21dbfc68743D9a5b2A220de2F68c084f937cEe4F',
};

// Contract addresses shorthand
export const CONTRACT_CONFIG = {
  RPC_URL: BLOCKCHAIN_CONFIG.RPC_URL,
  CHAIN_ID: BLOCKCHAIN_CONFIG.CHAIN_ID,
  CREDIT_REGISTRY: BLOCKCHAIN_CONFIG.CREDIT_REGISTRY_ADDRESS,
  CREDORA_POOL: BLOCKCHAIN_CONFIG.CREDORA_POOL_ADDRESS,
  MOCK_USDT: BLOCKCHAIN_CONFIG.MOCK_USDT_ADDRESS,
  BLOCK_EXPLORER: 'https://hoodi.blockscout.com',
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
