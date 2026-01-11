import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth';
import {
  submitStudentProfile,
  getStudentProfile,
  refreshCreditScore,
} from '../controllers/studentProfile.controller';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);
router.use(requireRole(['student']));

// Submit student profile with resume
router.post('/profile', upload.single('resume'), submitStudentProfile);

// Get student profile
router.get('/profile', getStudentProfile);

// Refresh credit score and limits
router.post('/refresh-score', refreshCreditScore);

export default router;
