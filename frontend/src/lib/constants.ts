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

// Contract ABIs
export const CREDIT_REGISTRY_ABI = [
  'function isValid(address user) view returns (bool)',
  'function getCreditLimit(address user) view returns (uint256 limit, uint256 expiry)',
  'function limitOf(address user) view returns (uint256)',
  'function scoreOf(address user) view returns (uint256)',
  'function expiryOf(address user) view returns (uint256)',
];

export const CREDORA_POOL_ABI = [
  // View functions
  'function totalLiquidity() view returns (uint256)',
  'function totalBorrowed() view returns (uint256)',
  'function totalShares() view returns (uint256)',
  'function getBorrowerDebt(address) view returns (uint256 principal, uint256 debt, uint256 dueAtTimestamp)',
  'function balanceOf(address) view returns (uint256)',
  'function previewWithdraw(uint256 shares) view returns (uint256)',
  'function userTotalDebt(address) view returns (uint256)',
  'function availableCredit(address) view returns (uint256)',
  
  // Write functions
  'function borrow(uint256 amount) external',
  'function repay(uint256 amount) external',
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shares) external',
  
  // Events
  'event Borrowed(address indexed user, uint256 amount, uint256 newPrincipal, uint256 dueAt)',
  'event Repaid(address indexed user, uint256 amount, uint256 principalPaid, uint256 interestPaid, uint256 reserveCut)',
  'event Deposited(address indexed user, uint256 amount, uint256 shares)',
  'event Withdrawn(address indexed user, uint256 amount, uint256 shares)',
];

export const MOCK_USDT_ABI = [
  // View functions
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // Write functions
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function mint(address to, uint256 amount) external',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];
