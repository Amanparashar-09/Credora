import { ethers } from 'ethers';

export const CONTRACT_CONFIG = {
  // Network Configuration
  RPC_URL: process.env.RPC_URL || 'http://127.0.0.1:8545',
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '31337'),

  // Contract Addresses
  CREDIT_REGISTRY: process.env.CREDIT_REGISTRY_ADDRESS || '',
  CREDORA_POOL: process.env.CREDORA_POOL_ADDRESS || '',
  MOCK_USDT: process.env.MOCK_USDT_ADDRESS || '',

  // Attester Configuration
  ATTESTER_PRIVATE_KEY: process.env.ATTESTER_PRIVATE_KEY || '',
  ATTESTER_ADDRESS: process.env.ATTESTER_ADDRESS || '',

  // Gas Configuration
  GAS_LIMIT: 500000,
  MAX_FEE_PER_GAS: ethers.parseUnits('50', 'gwei'),
  MAX_PRIORITY_FEE_PER_GAS: ethers.parseUnits('2', 'gwei'),
};

// EIP-712 Domain for CreditRegistry
export const EIP712_DOMAIN = {
  name: 'CredoraRegistry',
  version: '1',
  chainId: CONTRACT_CONFIG.CHAIN_ID,
  verifyingContract: CONTRACT_CONFIG.CREDIT_REGISTRY,
};

// EIP-712 Types for Limit struct
export const EIP712_TYPES = {
  Limit: [
    { name: 'holder', type: 'address' },
    { name: 'score', type: 'uint16' },
    { name: 'limit', type: 'uint256' },
    { name: 'validUntil', type: 'uint40' },
    { name: 'nonce', type: 'uint256' },
  ],
};

// Interest Rate Constants (matching CredoraPool.sol)
export const POOL_CONSTANTS = {
  RAY: 1e27, // High precision constant
  KINK: 0.8, // 80% utilization kink point
  BASE_RATE: 0.02, // 2% base annual rate
  KINK_RATE: 0.10, // 10% rate at kink
  MAX_RATE: 0.50, // 50% max rate at 100% utilization
  GRACE_PERIOD: 7 * 24 * 60 * 60, // 7 days in seconds
  DEFAULT_WINDOW: 30 * 24 * 60 * 60, // 30 days in seconds
};

// Credit Score Ranges
export const CREDIT_RANGES = {
  EXCELLENT: { min: 800, max: 1000 },
  GOOD: { min: 700, max: 799 },
  FAIR: { min: 600, max: 699 },
  POOR: { min: 300, max: 599 },
  MINIMUM: 300,
  MAXIMUM: 1000,
};

// Validation Constants
export const VALIDATION = {
  MAX_CREDIT_LIMIT: ethers.parseUnits('100000', 18), // 100k USDT max
  MIN_CREDIT_LIMIT: ethers.parseUnits('100', 18), // 100 USDT min
  MAX_BORROW_AMOUNT: ethers.parseUnits('50000', 18), // 50k USDT max single borrow
  MIN_DEPOSIT_AMOUNT: ethers.parseUnits('10', 18), // 10 USDT min deposit
  ATTESTATION_VALIDITY_DAYS: 90, // Credit attestation valid for 90 days
};
