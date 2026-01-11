import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { StudentProfile } from '../models/StudentProfile';
import aiEngineService from '../services/aiEngine.service';
import { blockchainService } from '../services/blockchainService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Submit student profile for credit scoring
 */
export const submitStudentProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const walletAddress = req.user?.address?.toLowerCase();
    if (!walletAddress) {
      throw new ValidationError('Wallet address not found');
    }

    const { githubUsername, gpa, internships } = req.body;

    // Validation
    if (!githubUsername || !gpa || internships === undefined) {
      throw new ValidationError('Missing required fields: githubUsername, gpa, internships');
    }

    if (!req.file) {
      throw new ValidationError('Resume PDF is required');
    }

    const gpaNum = parseFloat(gpa);
    const internshipsNum = parseInt(internships);

    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
      throw new ValidationError('Invalid GPA (must be 0-10)');
    }

    if (isNaN(internshipsNum) || internshipsNum < 0) {
      throw new ValidationError('Invalid internships count');
    }

    logger.info(`Submitting profile for wallet: ${walletAddress}`);

    // Calculate resume hash
    const resumeHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    // Get credit score from AI engine
    const creditScore = await aiEngineService.getStudentCreditScore({
      githubUsername,
      gpa: gpaNum,
      internships: internshipsNum,
      resumeBuffer: req.file.buffer,
      resumeFilename: req.file.originalname,
    });

    // Get total pool liquidity from blockchain
    const poolStats = await blockchainService.getPoolStats();
    const totalLiquidity = parseFloat(poolStats.totalLiquidity);

    // Calculate borrowing limit
    const borrowingLimit = aiEngineService.calculateBorrowingLimit(
      creditScore,
      totalLiquidity
    );

    // Save or update student profile
    const student = await StudentProfile.findOneAndUpdate(
      { walletAddress },
      {
        walletAddress,
        githubUsername,
        gpa: gpaNum,
        internships: internshipsNum,
        resumeHash,
        creditScore: borrowingLimit.creditScore,
        maxBorrowingLimit: borrowingLimit.maxBorrowingLimit,
        interestRate: borrowingLimit.interestRate,
        riskTier: borrowingLimit.riskTier,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info(`Credit score calculated: ${creditScore}, Limit: ${borrowingLimit.maxBorrowingLimit}`);

    res.status(200).json({
      success: true,
      message: 'Profile submitted successfully',
      data: {
        walletAddress: student.walletAddress,
        creditScore: student.creditScore,
        maxBorrowingLimit: student.maxBorrowingLimit,
        interestRate: student.interestRate,
        riskTier: student.riskTier,
        availableCredit: student.maxBorrowingLimit - student.currentBorrowed,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student profile and credit information
 */
export const getStudentProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const walletAddress = req.user?.address?.toLowerCase();
    if (!walletAddress) {
      throw new ValidationError('Wallet address not found');
    }

    const student = await StudentProfile.findOne({ walletAddress });

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    // Get current pool liquidity to recalculate limit if needed
    const poolStats = await blockchainService.getPoolStats();
    const totalLiquidity = parseFloat(poolStats.totalLiquidity);

    // Recalculate limit based on current pool size
    const updatedLimit = aiEngineService.calculateBorrowingLimit(
      student.creditScore,
      totalLiquidity
    );

    // Update if limit changed significantly (>5%)
    if (
      Math.abs(updatedLimit.maxBorrowingLimit - student.maxBorrowingLimit) >
      student.maxBorrowingLimit * 0.05
    ) {
      student.maxBorrowingLimit = updatedLimit.maxBorrowingLimit;
      student.lastUpdated = new Date();
      await student.save();
    }

    res.status(200).json({
      success: true,
      data: {
        walletAddress: student.walletAddress,
        githubUsername: student.githubUsername,
        gpa: student.gpa,
        internships: student.internships,
        creditScore: student.creditScore,
        maxBorrowingLimit: student.maxBorrowingLimit,
        availableCredit: student.maxBorrowingLimit - student.currentBorrowed,
        currentBorrowed: student.currentBorrowed,
        interestRate: student.interestRate,
        riskTier: student.riskTier,
        totalBorrowed: student.totalBorrowed,
        totalRepaid: student.totalRepaid,
        lastUpdated: student.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh credit score and limits
 */
export const refreshCreditScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const walletAddress = req.user?.address?.toLowerCase();
    if (!walletAddress) {
      throw new ValidationError('Wallet address not found');
    }

    const student = await StudentProfile.findOne({ walletAddress });
    if (!student) {
      throw new NotFoundError('Student profile not found. Please submit profile first.');
    }

    // Get current pool liquidity
    const poolStats = await blockchainService.getPoolStats();
    const totalLiquidity = parseFloat(poolStats.totalLiquidity);

    // Recalculate borrowing limit
    const borrowingLimit = aiEngineService.calculateBorrowingLimit(
      student.creditScore,
      totalLiquidity
    );

    student.maxBorrowingLimit = borrowingLimit.maxBorrowingLimit;
    student.lastUpdated = new Date();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Credit limits refreshed',
      data: {
        maxBorrowingLimit: student.maxBorrowingLimit,
        availableCredit: student.maxBorrowingLimit - student.currentBorrowed,
        lastUpdated: student.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};
