import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Student } from '../models/Student';
import { Investor } from '../models/Investor';
import { AuthenticationError, ValidationError } from '../utils/errors';
import { verifySignature, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate nonce for wallet signature
router.post('/nonce', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.body;

    if (!address) {
      throw new ValidationError('Wallet address is required');
    }

    const normalizedAddress = address.toLowerCase();
    const nonce = `Sign this message to authenticate with Credora.\n\nNonce: ${Date.now()}\nAddress: ${normalizedAddress}`;

    res.json({
      success: true,
      data: { nonce },
    });
  } catch (error) {
    next(error);
  }
});

// Login/Register with wallet signature
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address, signature, message, role } = req.body;

    // Validate inputs
    if (!address || !signature || !message || !role) {
      throw new ValidationError('Address, signature, message, and role are required');
    }

    if (!['student', 'investor'].includes(role)) {
      throw new ValidationError('Role must be either "student" or "investor"');
    }

    const normalizedAddress = address.toLowerCase();

    // Verify signature
    const isValid = await verifySignature(message, signature, normalizedAddress);
    if (!isValid) {
      throw new AuthenticationError('Invalid signature');
    }

    // Find or create user based on role
    let user;
    if (role === 'student') {
      user = await Student.findOne({ walletAddress: normalizedAddress });
      if (!user) {
        user = await Student.create({
          walletAddress: normalizedAddress,
          onboardingCompleted: false,
        });
      }
      user.lastActive = new Date();
      await user.save();
    } else {
      user = await Investor.findOne({ walletAddress: normalizedAddress });
      if (!user) {
        user = await Investor.create({
          walletAddress: normalizedAddress,
        });
      }
      user.lastActive = new Date();
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      {
        address: normalizedAddress,
        role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          address: normalizedAddress,
          role,
          ...(role === 'student' && {
            onboardingCompleted: (user as any).onboardingCompleted,
            creditScore: (user as any).creditScore,
          }),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Verify token
router.get('/verify', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      address: string;
      role: 'student' | 'investor';
    };

    res.json({
      success: true,
      data: {
        address: decoded.address,
        role: decoded.role,
      },
    });
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
});

export default router;
