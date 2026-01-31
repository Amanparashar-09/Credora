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
    
    logger.info(`Pool Stats - Total Liquidity: ${totalLiquidity} USDT`);
    logger.info(`Student Credit Score: ${creditScore}`);

    // Calculate borrowing limit
    const borrowingLimit = aiEngineService.calculateBorrowingLimit(
      creditScore,
      totalLiquidity
    );
    
    logger.info(`Calculated Borrow Limit: ${borrowingLimit.maxBorrowingLimit} USDT (${(borrowingLimit.maxBorrowingLimit / totalLiquidity * 100).toFixed(1)}% of pool)`);
    logger.info(`Interest Rate: ${borrowingLimit.interestRate}%, Risk Tier: ${borrowingLimit.riskTier}`);

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
        // Basic info
        name: student.name,
        email: student.email,
        phone: student.phone,
        // Academic
        university: student.university,
        degree: student.degree,
        branch: student.branch,
        graduationYear: student.graduationYear,
        semester: student.semester,
        gpa: student.gpa,
        // GitHub
        githubUsername: student.githubUsername,
        repositoriesCount: student.repositoriesCount,
        contributionsCount: student.contributionsCount,
        // Work
        internships: student.internships,
        // Skills
        skills: student.skills || [],
        certifications: student.certifications || [],
        // Credit info
        creditScore: student.creditScore,
        maxBorrowingLimit: student.maxBorrowingLimit,
        availableCredit: student.maxBorrowingLimit - student.currentBorrowed,
        currentBorrowed: student.currentBorrowed,
        interestRate: student.interestRate,
        riskTier: student.riskTier,
        totalBorrowed: student.totalBorrowed,
        totalRepaid: student.totalRepaid,
        defaultCount: student.defaultCount ?? 0,
        lastUpdated: student.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync borrowing data from blockchain
 */
export const syncBorrowingData = async (
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

    // Get current debt from blockchain
    const debtInfo = await blockchainService.getBorrowerDebt(walletAddress);
    const principal = parseFloat(debtInfo.principal) || 0;

    // Calculate total borrowed (accumulate if new borrowing detected)
    const previousBorrowed = student.currentBorrowed || 0;
    if (principal > previousBorrowed) {
      // New borrowing detected
      student.totalBorrowed = (student.totalBorrowed || 0) + (principal - previousBorrowed);
    }

    // Calculate repaid amount
    if (principal < previousBorrowed && previousBorrowed > 0) {
      // Repayment detected
      const repaidAmount = previousBorrowed - principal;
      student.totalRepaid = (student.totalRepaid || 0) + repaidAmount;
    }

    // Update current borrowed
    student.currentBorrowed = principal;

    // Check for defaults
    if (debtInfo.isDefaulted) {
      student.defaultCount = (student.defaultCount || 0) + 1;
    }

    student.lastUpdated = new Date();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Borrowing data synced from blockchain',
      data: {
        currentBorrowed: student.currentBorrowed,
        totalBorrowed: student.totalBorrowed,
        totalRepaid: student.totalRepaid,
        defaultCount: student.defaultCount,
        availableCredit: student.maxBorrowingLimit - student.currentBorrowed,
        lastUpdated: student.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student profile (basic info, academic details, etc.)
 */
export const updateStudentProfile = async (
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
      throw new NotFoundError('Student profile not found. Please complete onboarding first.');
    }

    // Fields that can be updated
    const {
      name,
      email,
      phone,
      university,
      degree,
      branch,
      graduationYear,
      semester,
      gpa,
      githubUsername,
      repositoriesCount,
      contributionsCount,
      internships,
      skills,
      certifications,
    } = req.body;

    // Update basic info
    if (name !== undefined) student.name = name;
    if (email !== undefined) student.email = email;
    if (phone !== undefined) student.phone = phone;

    // Update academic details
    if (university !== undefined) student.university = university;
    if (degree !== undefined) student.degree = degree;
    if (branch !== undefined) student.branch = branch;
    if (graduationYear !== undefined) student.graduationYear = parseInt(graduationYear) || undefined;
    if (semester !== undefined) student.semester = semester;
    
    // Update GPA with validation
    if (gpa !== undefined) {
      const gpaNum = parseFloat(gpa);
      if (!isNaN(gpaNum) && gpaNum >= 0 && gpaNum <= 10) {
        student.gpa = gpaNum;
      }
    }

    // Update GitHub info
    if (githubUsername !== undefined) student.githubUsername = githubUsername;
    if (repositoriesCount !== undefined) student.repositoriesCount = parseInt(repositoriesCount) || 0;
    if (contributionsCount !== undefined) student.contributionsCount = parseInt(contributionsCount) || 0;

    // Update work experience
    if (internships !== undefined) {
      const internshipsNum = parseInt(internships);
      if (!isNaN(internshipsNum) && internshipsNum >= 0) {
        student.internships = internshipsNum;
      }
    }

    // Update skills and certifications
    if (skills !== undefined && Array.isArray(skills)) {
      student.skills = skills.filter((s: string) => typeof s === 'string' && s.trim());
    }
    if (certifications !== undefined && Array.isArray(certifications)) {
      student.certifications = certifications.filter((c: string) => typeof c === 'string' && c.trim());
    }

    student.lastUpdated = new Date();
    await student.save();

    logger.info(`Profile updated for wallet: ${walletAddress}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        walletAddress: student.walletAddress,
        name: student.name,
        email: student.email,
        phone: student.phone,
        university: student.university,
        degree: student.degree,
        branch: student.branch,
        graduationYear: student.graduationYear,
        semester: student.semester,
        gpa: student.gpa,
        githubUsername: student.githubUsername,
        repositoriesCount: student.repositoriesCount,
        contributionsCount: student.contributionsCount,
        internships: student.internships,
        skills: student.skills,
        certifications: student.certifications,
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
