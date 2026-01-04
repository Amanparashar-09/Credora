import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  const healthcheck = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'healthy',
      database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    environment: process.env.NODE_ENV,
  };

  const statusCode = healthcheck.services.database === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

export default router;
