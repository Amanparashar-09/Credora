import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';

interface StudentProfile {
  githubUsername: string;
  gpa: number;
  internships: number;
  resumeBuffer: Buffer;
  resumeFilename: string;
}

interface AIScoreResponse {
  credora_score: number;
  status: string;
}

interface BorrowingLimit {
  creditScore: number;
  maxBorrowingLimit: number;
  interestRate: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
}

class AIEngineService {
  private readonly AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

  /**
   * Send student data to AI engine and get credit score
   */
  async getStudentCreditScore(profile: StudentProfile): Promise<number> {
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('github_username', profile.githubUsername);
      formData.append('gpa', profile.gpa.toString());
      formData.append('internships', profile.internships.toString());
      
      // Add PDF file as buffer
      formData.append('resume', profile.resumeBuffer, {
        filename: profile.resumeFilename,
        contentType: 'application/pdf',
      });

      logger.info(`[AI Engine] Requesting score for student: ${profile.githubUsername}`);

      const response = await axios.post<AIScoreResponse>(
        `${this.AI_ENGINE_URL}/score`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.status === 'success') {
        logger.info(`[AI Engine] Score received: ${response.data.credora_score}`);
        return response.data.credora_score;
      }

      throw new Error('AI Engine returned non-success status');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('[AI Engine] Request failed:', error.response?.data || error.message);
        throw new Error(`AI Engine error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Calculate borrowing limit based on credit score and pool liquidity
   */
  calculateBorrowingLimit(
    creditScore: number,
    totalPoolLiquidity: number
  ): BorrowingLimit {
    // Credit score ranges (adjust based on your AI model output)
    let maxBorrowingPercentage: number;
    let interestRate: number;
    let riskTier: 'LOW' | 'MEDIUM' | 'HIGH';

    if (creditScore >= 750) {
      // Excellent credit
      maxBorrowingPercentage = 0.10; // 10% of pool
      interestRate = 8.0;
      riskTier = 'LOW';
    } else if (creditScore >= 650) {
      // Good credit
      maxBorrowingPercentage = 0.05; // 5% of pool
      interestRate = 12.0;
      riskTier = 'MEDIUM';
    } else if (creditScore >= 550) {
      // Fair credit
      maxBorrowingPercentage = 0.03; // 3% of pool
      interestRate = 15.0;
      riskTier = 'MEDIUM';
    } else {
      // Poor credit
      maxBorrowingPercentage = 0.01; // 1% of pool
      interestRate = 20.0;
      riskTier = 'HIGH';
    }

    const maxBorrowingLimit = totalPoolLiquidity * maxBorrowingPercentage;

    return {
      creditScore,
      maxBorrowingLimit: Math.floor(maxBorrowingLimit), // Round down
      interestRate,
      riskTier,
    };
  }

  /**
   * Check AI Engine health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.AI_ENGINE_URL}/health`, {
        timeout: 5000,
      });
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('[AI Engine] Health check failed:', error);
      return false;
    }
  }
}

export default new AIEngineService();
