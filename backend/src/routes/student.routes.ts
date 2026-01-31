import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter, uploadLimiter } from '../middleware/rateLimiter';
import { studentController } from '../controllers/student.controller';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.pdf,.doc,.docx,.jpg,.jpeg,.png').split(',');
    const fileExt = '.' + file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// All routes require authentication and student role
router.use(authenticate);
router.use(requireRole(['student']));

// Profile management
router.get('/profile', apiLimiter, studentController.getProfile);
router.put('/profile', apiLimiter, studentController.updateProfile);

// Onboarding
router.post('/onboard', apiLimiter, studentController.completeOnboarding);

// Document management
router.post(
  '/documents/upload',
  uploadLimiter,
  upload.single('document'),
  studentController.uploadDocument
);
router.get('/documents', apiLimiter, studentController.getDocuments);
router.get('/documents/:id', apiLimiter, studentController.getDocument);

// Credit scoring
router.post('/submit-for-scoring', apiLimiter, studentController.submitForScoring);
router.get('/attestation-data', apiLimiter, studentController.getAttestationData);
router.get('/onchain-credit', apiLimiter, studentController.getOnChainCredit);
router.get('/credit-status', apiLimiter, studentController.getCreditStatus);
router.get('/credit-history', apiLimiter, studentController.getCreditHistory);

// Borrowing
router.get('/borrowing-status', apiLimiter, studentController.getBorrowingStatus);
router.get('/borrowing-history', apiLimiter, studentController.getBorrowingHistory);
router.post('/borrow', apiLimiter, studentController.borrowFunds);
router.post('/repay', apiLimiter, studentController.repayLoan);
router.post('/pay-slice', apiLimiter, studentController.paySlice);

// Dashboard stats
router.get('/dashboard', apiLimiter, studentController.getDashboard);

export default router;
