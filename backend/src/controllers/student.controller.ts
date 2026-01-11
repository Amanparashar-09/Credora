import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Student } from '../models/Student';
import { StudentProfile } from '../models/StudentProfile';
import { Document } from '../models/Document';
import { CreditHistory } from '../models/CreditHistory';
import { ValidationError, NotFoundError } from '../utils/errors';
import { aiService } from '../services/aiService';
import { oracleService } from '../services/oracleService';
import { blockchainService } from '../services/blockchainService';
import { encryptionService } from '../services/encryptionService';
import { logger } from '../utils/logger';

export const studentController = {
  /**
   * Get student profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findOne({ walletAddress: req.user!.address });
      
      if (!student) {
        throw new NotFoundError('Student profile not found');
      }

      res.json({
        success: true,
        data: {
          walletAddress: student.walletAddress,
          email: student.email,
          name: student.name,
          dateOfBirth: student.dateOfBirth,
          university: student.university,
          major: student.major,
          graduationYear: student.graduationYear,
          phoneNumber: student.phoneNumber,
          creditScore: student.creditScore,
          creditLimit: student.creditLimit,
          creditExpiry: student.creditExpiry,
          onboardingCompleted: student.onboardingCompleted,
          documentsSubmitted: student.documentsSubmitted,
          kycVerified: student.kycVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update student profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, name, dateOfBirth, university, major, graduationYear, phoneNumber } = req.body;

      const student = await Student.findOneAndUpdate(
        { walletAddress: req.user!.address },
        {
          $set: {
            email,
            name,
            dateOfBirth,
            university,
            major,
            graduationYear,
            phoneNumber,
            lastActive: new Date(),
          },
        },
        { new: true, runValidators: true }
      );

      if (!student) {
        throw new NotFoundError('Student profile not found');
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findOneAndUpdate(
        { walletAddress: req.user!.address },
        {
          $set: {
            onboardingCompleted: true,
            lastActive: new Date(),
          },
        },
        { new: true }
      );

      if (!student) {
        throw new NotFoundError('Student profile not found');
      }

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        data: { onboardingCompleted: true },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload document
   */
  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const { documentType, metadata } = req.body;

      if (!documentType) {
        throw new ValidationError('Document type is required');
      }

      // Encrypt and save file
      const { filePath, iv } = await encryptionService.saveEncryptedFile(
        req.file.buffer,
        req.user!.address,
        req.file.originalname
      );

      // Create document record
      const document = await Document.create({
        studentAddress: req.user!.address,
        documentType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        encryptedPath: filePath,
        encryptionIV: iv,
        metadata: metadata ? JSON.parse(metadata) : {},
      });

      // Update student's document status
      await Student.findOneAndUpdate(
        { walletAddress: req.user!.address },
        { $set: { documentsSubmitted: true } }
      );

      logger.info('Document uploaded successfully', {
        studentAddress: req.user!.address,
        documentType,
        fileName: req.file.originalname,
      });

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          documentId: document._id,
          fileName: document.fileName,
          documentType: document.documentType,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all documents
   */
  async getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const documents = await Document.find({ studentAddress: req.user!.address })
        .select('-encryptedPath -encryptionIV')
        .sort({ uploadedAt: -1 });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get specific document
   */
  async getDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const document = await Document.findOne({
        _id: req.params.id,
        studentAddress: req.user!.address,
      });

      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Decrypt file
      const decryptedData = await encryptionService.readEncryptedFile(
        document.encryptedPath,
        document.encryptionIV
      );

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.send(decryptedData);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit for credit scoring
   */
  async submitForScoring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findOne({ walletAddress: req.user!.address });
      
      if (!student) {
        throw new NotFoundError('Student profile not found');
      }

      if (!student.documentsSubmitted) {
        throw new ValidationError('Please upload required documents first');
      }

      // Prepare data for AI scoring
      const scoringData = {
        university: student.university || 'Unknown',
        major: student.major || 'Unknown',
        graduationYear: student.graduationYear || new Date().getFullYear(),
        // Add more fields as needed
      };

      // Call AI engine
      const scoreResult = await aiService.calculateCreditScore(scoringData);

      // Create attestation via oracle
      const { attestation, signature } = await oracleService.createCreditAttestation(
        req.user!.address,
        scoreResult.credora_score,
        scoreResult.credit_limit
      );

      // Update student record
      student.creditScore = scoreResult.credora_score;
      student.creditLimit = scoreResult.credit_limit.toString();
      student.creditExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      await student.save();

      logger.info('Credit scoring completed', {
        studentAddress: req.user!.address,
        score: scoreResult.credora_score,
        limit: scoreResult.credit_limit,
      });

      res.json({
        success: true,
        message: 'Credit scoring completed successfully. You need to register this on-chain before borrowing.',
        data: {
          score: scoreResult.credora_score,
          limit: scoreResult.credit_limit,
          riskLevel: scoreResult.risk_level,
          attestation,
          signature,
          needsOnChainRegistration: true,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get attestation data for on-chain registration
   */
  async getAttestationData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findOne({ walletAddress: req.user!.address });
      
      if (!student) {
        throw new NotFoundError('Student profile not found');
      }

      if (!student.creditScore || !student.creditLimit) {
        throw new ValidationError('Please complete credit scoring first');
      }

      // Calculate credit limit from score if it's 0 or missing
      let creditLimitInUsdt: number;
      const storedLimit = student.creditLimit;
      
      // Check if the stored limit is in wei format (very large number, > 1e15)
      // or in USD format (small number like 500, 1000, 10000)
      const storedLimitNum = parseFloat(storedLimit);
      
      if (storedLimitNum > 1e15) {
        // Already in wei format, convert back to USD
        creditLimitInUsdt = storedLimitNum / 1e18;
      } else if (storedLimitNum > 0) {
        // Already in USD format
        creditLimitInUsdt = storedLimitNum;
      } else {
        // Calculate from score
        const score = student.creditScore;
        if (score < 20) creditLimitInUsdt = 500;
        else if (score < 40) creditLimitInUsdt = 1000;
        else if (score < 60) creditLimitInUsdt = 2500;
        else if (score < 80) creditLimitInUsdt = 5000;
        else creditLimitInUsdt = 10000;
      }

      // Create fresh attestation (this fetches on-chain nonce internally)
      const { attestation, signature } = await oracleService.createCreditAttestation(
        req.user!.address,
        student.creditScore,
        creditLimitInUsdt
      );

      res.json({
        success: true,
        data: {
          user: attestation.user,
          score: attestation.score,
          creditLimit: attestation.creditLimit.toString(),
          expiry: attestation.expiry,
          nonce: attestation.nonce,
          signature: signature,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get credit status
   */
  async getCreditStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findOne({ walletAddress: req.user!.address });
      
      if (!student) {
        throw new NotFoundError('Student profile not found');
      }

      // Get on-chain credit limit with fallback
      let onChainCredit;
      try {
        onChainCredit = await blockchainService.getCreditLimit(req.user!.address);
      } catch (blockchainError: any) {
        logger.error('Blockchain read failed, using off-chain data:', blockchainError.message);
        // Fallback to off-chain data if blockchain is unavailable
        onChainCredit = {
          score: student.creditScore || 0,
          limit: student.creditLimit || '0',
          validUntil: student.creditExpiry || new Date(),
          nonce: student.nonce || 0,
        };
      }

      res.json({
        success: true,
        data: {
          offChain: {
            score: student.creditScore,
            limit: student.creditLimit,
            expiry: student.creditExpiry,
            nonce: student.nonce,
          },
          onChain: onChainCredit,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get credit history
   */
  async getCreditHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const history = await CreditHistory.find({ studentAddress: req.user!.address })
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get borrowing status
   */
  async getBorrowingStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findOne({ walletAddress: req.user!.address });
      const debtInfo = await blockchainService.getBorrowerDebt(req.user!.address);

      res.json({
        success: true,
        data: {
          totalBorrowed: student?.totalBorrowed || '0',
          totalRepaid: student?.totalRepaid || '0',
          activeBorrows: student?.activeBorrows || 0,
          currentDebt: debtInfo,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get borrowing history
   */
  async getBorrowingHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findOne({ walletAddress: req.user!.address });

      res.json({
        success: true,
        data: {
          repaymentHistory: student?.repaymentHistory || [],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Borrow funds from the pool
   */
  async borrowFunds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        throw new ValidationError('Invalid borrow amount');
      }

      const student = await Student.findOne({ walletAddress: req.user!.address });
      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Note: This is a demo endpoint. In production:
      // 1. User would call smart contract directly from frontend
      // 2. Backend would listen to blockchain events
      // 3. Update database when Borrowed event is emitted
      
      res.json({
        success: true,
        data: {
          message: 'Borrow request processed. Connect wallet to complete transaction.',
          amount,
          contractAddress: process.env.CREDORA_POOL_ADDRESS,
          method: 'borrow',
          params: [amount],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Repay loan
   */
  async repayLoan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        throw new ValidationError('Invalid repayment amount');
      }

      const student = await Student.findOne({ walletAddress: req.user!.address });
      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Note: This is a demo endpoint. In production:
      // 1. User would call smart contract directly from frontend
      // 2. Backend would listen to blockchain events
      // 3. Update database when Repaid event is emitted
      
      res.json({
        success: true,
        data: {
          message: 'Repayment request processed. Connect wallet to complete transaction.',
          amount,
          contractAddress: process.env.CREDORA_POOL_ADDRESS,
          method: 'repay',
          params: [amount],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Pay individual slice (EMI installment)
   */
  async paySlice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sliceId, amount } = req.body;

      if (!sliceId || !amount || amount <= 0) {
        throw new ValidationError('Invalid slice payment data');
      }

      const student = await Student.findOne({ walletAddress: req.user!.address });
      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Note: This is a demo endpoint. In production:
      // 1. User would call smart contract repay() function
      // 2. Pass the slice amount as parameter
      // 3. Backend listens to Repaid event
      // 4. Update slice status in database
      
      res.json({
        success: true,
        data: {
          message: 'Slice payment processed. Connect wallet to complete transaction.',
          sliceId,
          amount,
          contractAddress: process.env.CREDORA_POOL_ADDRESS,
          method: 'repay',
          params: [amount],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get dashboard data
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [student, studentProfile, debtInfo] = await Promise.all([
        Student.findOne({ walletAddress: req.user!.address }),
        StudentProfile.findOne({ walletAddress: req.user!.address }),
        blockchainService.getBorrowerDebt(req.user!.address),
      ]);

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Use StudentProfile data if available, otherwise use Student data
      const creditScore = studentProfile?.creditScore || student.creditScore || 0;
      const creditLimit = studentProfile?.maxBorrowingLimit || parseFloat(student.creditLimit || '0');
      const currentBorrowed = studentProfile?.currentBorrowed || parseFloat(debtInfo.debt || '0');
      const availableCredit = Math.max(0, creditLimit - currentBorrowed);

      // Get interest rate from studentProfile
      const interestRate = studentProfile?.interestRate || 12;

      // Calculate next payment details
      const nextPaymentAmount = currentBorrowed > 0 ? (currentBorrowed / 10).toFixed(2) : '0';
      const nextPaymentDue = debtInfo.dueAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get recent credit history for transactions
      const creditHistory = await CreditHistory.find({ studentAddress: req.user!.address })
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          profile: {
            walletAddress: student.walletAddress,
            name: student.name,
            email: student.email,
            university: student.university,
            major: student.major,
            gpa: studentProfile?.gpa,
            graduationYear: student.graduationYear,
            githubUsername: studentProfile?.githubUsername,
            isOnboarded: student.onboardingCompleted,
            createdAt: student.createdAt,
            updatedAt: student.lastActive,
          },
          credit: {
            score: creditScore,
            limit: creditLimit.toFixed(2),
            available: availableCredit.toFixed(2),
            used: currentBorrowed.toFixed(2),
            validUntil: student.creditExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            interestRate: interestRate,
            grade: creditScore >= 750 ? 'A+' : creditScore >= 650 ? 'A' : creditScore >= 550 ? 'B' : 'C',
          },
          borrowing: {
            totalBorrowed: currentBorrowed.toFixed(2),
            principal: currentBorrowed.toFixed(2),
            interest: (currentBorrowed * (interestRate / 100)).toFixed(2),
            nextPaymentDue: nextPaymentDue,
            nextPaymentAmount: nextPaymentAmount,
          },
          recentTransactions: creditHistory.map(tx => ({
            id: tx._id.toString(),
            type: 'borrow' as const,
            amount: tx.limit,
            timestamp: tx.createdAt,
            txHash: tx.signature,
            status: 'completed' as const,
          })),
          badges: [
            {
              name: 'First Borrow',
              icon: '🎯',
              earned: currentBorrowed > 0,
              earnedAt: currentBorrowed > 0 ? student.createdAt : undefined,
            },
            {
              name: 'High Score',
              icon: '⭐',
              earned: creditScore >= 700,
              earnedAt: creditScore >= 700 ? student.lastActive : undefined,
            },
            {
              name: 'Profile Complete',
              icon: '✅',
              earned: student.onboardingCompleted && !!studentProfile,
              earnedAt: student.onboardingCompleted ? student.createdAt : undefined,
            },
            {
              name: 'Good Standing',
              icon: '🏆',
              earned: !debtInfo.isDefaulted && currentBorrowed > 0,
              earnedAt: !debtInfo.isDefaulted && currentBorrowed > 0 ? student.lastActive : undefined,
            },
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
