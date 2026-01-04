import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Student } from '../models/Student';
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

      logger.info('Credit scoring completed', {
        studentAddress: req.user!.address,
        score: scoreResult.credora_score,
        limit: scoreResult.credit_limit,
      });

      res.json({
        success: true,
        message: 'Credit scoring completed successfully',
        data: {
          score: scoreResult.credora_score,
          limit: scoreResult.credit_limit,
          riskLevel: scoreResult.risk_level,
          attestation,
          signature,
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

      // Get on-chain credit limit
      const onChainCredit = await blockchainService.getCreditLimit(req.user!.address);

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
   * Get dashboard data
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [student, documents, debtInfo] = await Promise.all([
        Student.findOne({ walletAddress: req.user!.address }),
        Document.countDocuments({ studentAddress: req.user!.address }),
        blockchainService.getBorrowerDebt(req.user!.address),
      ]);

      res.json({
        success: true,
        data: {
          profile: {
            name: student?.name,
            university: student?.university,
            onboardingCompleted: student?.onboardingCompleted,
          },
          credit: {
            score: student?.creditScore,
            limit: student?.creditLimit,
            expiry: student?.creditExpiry,
          },
          borrowing: {
            currentDebt: debtInfo.debt,
            dueAt: debtInfo.dueAt,
            isDefaulted: debtInfo.isDefaulted,
          },
          documents: {
            uploaded: documents,
            submitted: student?.documentsSubmitted,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
