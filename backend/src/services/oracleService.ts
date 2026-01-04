import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONTRACT_CONFIG, EIP712_DOMAIN, EIP712_TYPES } from '../config/contracts';
import { CreditHistory } from '../models/CreditHistory';
import { Student } from '../models/Student';

const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.RPC_URL);
const attesterWallet = new ethers.Wallet(CONTRACT_CONFIG.ATTESTER_PRIVATE_KEY, provider);

export interface CreditAttestation {
  holder: string;
  score: number;
  limit: bigint;
  validUntil: number;
  nonce: number;
}

export const oracleService = {
  /**
   * Generate EIP-712 signature for credit limit update
   */
  async signCreditUpdate(attestation: CreditAttestation): Promise<string> {
    try {
      logger.info('Signing credit attestation', {
        holder: attestation.holder,
        score: attestation.score,
        limit: attestation.limit.toString(),
      });

      // Create the typed data message
      const message = {
        holder: attestation.holder,
        score: attestation.score,
        limit: attestation.limit,
        validUntil: attestation.validUntil,
        nonce: attestation.nonce,
      };

      // Sign using EIP-712
      const signature = await attesterWallet.signTypedData(
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
      const holder = studentAddress.toLowerCase();

      // Get student's current nonce
      const student = await Student.findOne({ walletAddress: holder });
      if (!student) {
        throw new Error('Student not found');
      }

      // Create attestation
      const validUntil = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
      const attestation: CreditAttestation = {
        holder,
        score,
        limit: ethers.parseUnits(limitInUsdt.toString(), 18), // Convert to 18 decimals
        validUntil,
        nonce: student.nonce,
      };

      // Sign attestation
      const signature = await this.signCreditUpdate(attestation);

      // Store in credit history
      await CreditHistory.create({
        studentAddress: holder,
        score,
        limit: attestation.limit.toString(),
        validUntil: new Date(validUntil * 1000),
        nonce: attestation.nonce,
        signature,
        signedBy: attesterWallet.address.toLowerCase(),
        metadata: {
          signedAt: new Date(),
        },
      });

      // Update student record
      student.creditScore = score;
      student.creditLimit = attestation.limit.toString();
      student.creditExpiry = new Date(validUntil * 1000);
      student.lastScoreUpdate = new Date();
      student.nonce += 1; // Increment nonce for next update
      await student.save();

      logger.info('Credit attestation created and stored', {
        holder,
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
        holder: attestation.holder,
        score: attestation.score,
        limit: attestation.limit,
        validUntil: attestation.validUntil,
        nonce: attestation.nonce,
      };

      const recoveredAddress = ethers.verifyTypedData(
        EIP712_DOMAIN,
        EIP712_TYPES,
        message,
        signature
      );

      return recoveredAddress.toLowerCase() === attesterWallet.address.toLowerCase();
    } catch (error) {
      return false;
    }
  },

  /**
   * Get attester address
   */
  getAttesterAddress(): string {
    return attesterWallet.address;
  },
};
