import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONTRACT_CONFIG, EIP712_DOMAIN, EIP712_TYPES } from '../config/contracts';
import { CreditHistory } from '../models/CreditHistory';
import { Student } from '../models/Student';
import { blockchainService } from './blockchainService';

// Lazy initialization to ensure env vars are loaded
let _provider: ethers.JsonRpcProvider | null = null;
let _attesterWallet: ethers.Wallet | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.RPC_URL);
  }
  return _provider;
}

function getAttesterWallet(): ethers.Wallet {
  if (!_attesterWallet) {
    if (!CONTRACT_CONFIG.ATTESTER_PRIVATE_KEY) {
      throw new Error('ATTESTER_PRIVATE_KEY not configured in environment');
    }
    _attesterWallet = new ethers.Wallet(CONTRACT_CONFIG.ATTESTER_PRIVATE_KEY, getProvider());
  }
  return _attesterWallet;
}

export interface CreditAttestation {
  user: string;
  score: number;
  creditLimit: bigint;
  expiry: number;
  nonce: number;
}

export const oracleService = {
  /**
   * Generate EIP-712 signature for credit limit update
   */
  async signCreditUpdate(attestation: CreditAttestation): Promise<string> {
    try {
      logger.info('Signing credit attestation', {
        user: attestation.user,
        score: attestation.score,
        creditLimit: attestation.creditLimit.toString(),
      });

      // Create the typed data message
      const message = {
        user: attestation.user,
        score: attestation.score,
        creditLimit: attestation.creditLimit,
        expiry: attestation.expiry,
        nonce: attestation.nonce,
      };

      // Sign using EIP-712
      const signature = await getAttesterWallet().signTypedData(
        EIP712_DOMAIN,
        EIP712_TYPES,
        message
      );

      logger.info('Credit attestation signed successfully', {
        signature: signature.substring(0, 10) + '...',
      });

      return signature;
    } catch (error: any) {
      logger.error('Failed to sign credit attestation:', error.message);
      throw new Error('Oracle signing failed');
    }
  },

  /**
   * Create and store credit attestation
   */
  async createCreditAttestation(
    studentAddress: string,
    score: number,
    limitInUsdt: number
  ): Promise<{
    attestation: CreditAttestation;
    signature: string;
  }> {
    try {
      // Normalize address
      const user = studentAddress.toLowerCase();

      // Get student's current nonce
      const student = await Student.findOne({ walletAddress: user });
      if (!student) {
        throw new Error('Student not found');
      }

      // Get current on-chain nonce from CreditRegistry contract
      const onChainNonce = await blockchainService.getCurrentNonce(user);

      // Create attestation
      const expiry = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
      const attestation: CreditAttestation = {
        user,
        score,
        creditLimit: ethers.parseUnits(limitInUsdt.toString(), 18), // Convert to 18 decimals
        expiry,
        nonce: onChainNonce, // Use on-chain nonce, not database nonce
      };

      // Sign attestation
      const signature = await this.signCreditUpdate(attestation);

      // Store in credit history
      await CreditHistory.create({
        studentAddress: user,
        score,
        limit: attestation.creditLimit.toString(),
        validUntil: new Date(expiry * 1000),
        nonce: attestation.nonce,
        signature,
        signedBy: getAttesterWallet().address.toLowerCase(),
        metadata: {
          signedAt: new Date(),
        },
      });

      // Update student record
      student.creditScore = score;
      student.creditLimit = attestation.creditLimit.toString();
      student.creditExpiry = new Date(expiry * 1000);
      student.lastScoreUpdate = new Date();
      student.nonce = (student.nonce || 0) + 1; // Increment nonce for next update
      await student.save();

      logger.info('Credit attestation created and stored', {
        user,
        score,
        nonce: attestation.nonce,
      });

      return { attestation, signature };
    } catch (error: any) {
      logger.error('Failed to create credit attestation:', error.message);
      throw error;
    }
  },

  /**
   * Verify a signature (for testing/validation)
   */
  verifySignature(attestation: CreditAttestation, signature: string): boolean {
    try {
      const message = {
        user: attestation.user,
        score: attestation.score,
        creditLimit: attestation.creditLimit,
        expiry: attestation.expiry,
        nonce: attestation.nonce,
      };

      const recoveredAddress = ethers.verifyTypedData(
        EIP712_DOMAIN,
        EIP712_TYPES,
        message,
        signature
      );

      return recoveredAddress.toLowerCase() === getAttesterWallet().address.toLowerCase();
    } catch (error) {
      return false;
    }
  },

  /**
   * Get attester address
   */
  getAttesterAddress(): string {
    return getAttesterWallet().address;
  },
};
