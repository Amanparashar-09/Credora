import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { investorController } from '../controllers/investor.controller';

const router = Router();

// All routes require authentication and investor role
router.use(authenticate);
router.use(requireRole(['investor']));

// Profile management
router.get('/profile', apiLimiter, investorController.getProfile);
router.put('/profile', apiLimiter, investorController.updateProfile);

// Pool information
router.get('/pools', apiLimiter, investorController.getPools);
router.get('/pools/:address/stats', apiLimiter, investorController.getPoolStats);

// Investment management
router.post('/invest', apiLimiter, investorController.invest);
router.post('/withdraw', apiLimiter, investorController.withdraw);
router.get('/portfolio', apiLimiter, investorController.getPortfolio);
router.get('/balance', apiLimiter, investorController.getBalance);
router.get('/returns', apiLimiter, investorController.getReturns);

// Analytics
router.get('/analytics', apiLimiter, investorController.getAnalytics);
router.get('/dashboard', apiLimiter, investorController.getDashboard);

export default router;
