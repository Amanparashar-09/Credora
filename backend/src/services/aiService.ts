import axios from 'axios';
import { logger } from '../utils/logger';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const AI_ENGINE_TIMEOUT = parseInt(process.env.AI_ENGINE_TIMEOUT || '30000');

export interface StudentDataForScoring {
  university: string;
  major: string;
  gpa?: number;
  graduationYear: number;
  workExperience?: number;
  certifications?: string[];
  skills?: string[];
  resumeText?: string;
  linkedinProfile?: string;
}

export interface CreditScoreResponse {
  credora_score: number;
  credit_limit: number;
  risk_level: 'low' | 'medium' | 'high';
  factors: string[];
  confidence: number;
}

export const aiService = {
  /**
   * Calculate credit score using AI engine
   */
  async calculateCreditScore(studentData: StudentDataForScoring): Promise<CreditScoreResponse> {
    try {
      logger.info('Requesting credit score from AI engine', {
        university: studentData.university,
        major: studentData.major,
      });

      const response = await axios.post(
        `${AI_ENGINE_URL}/score`,
        studentData,
        {
          timeout: AI_ENGINE_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.AI_ENGINE_API_KEY && {
              'Authorization': `Bearer ${process.env.AI_ENGINE_API_KEY}`,
            }),
          },
        }
      );

      const result: CreditScoreResponse = response.data;

      logger.info('Credit score calculated successfully', {
        score: result.credora_score,
        limit: result.credit_limit,
        riskLevel: result.risk_level,
      });

      return result;
    } catch (error: any) {
      logger.error('AI Engine request failed:', {
        error: error.message,
        url: AI_ENGINE_URL,
        timeout: AI_ENGINE_TIMEOUT,
      });

      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI Engine is not reachable. Please ensure it is running.');
      }

      if (error.response) {
        throw new Error(`AI Engine error: ${error.response.data?.message || error.response.statusText}`);
      }

      throw new Error('Failed to calculate credit score');
    }
  },

  /**
   * Health check for AI engine
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${AI_ENGINE_URL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.warn('AI Engine health check failed');
      return false;
    }
  },

  /**
   * Parse resume text (if AI engine supports it)
   */
  async parseResume(resumeText: string): Promise<any> {
    try {
      const response = await axios.post(
        `${AI_ENGINE_URL}/parse-resume`,
        { text: resumeText },
        { timeout: AI_ENGINE_TIMEOUT }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Resume parsing failed:', error.message);
      throw new Error('Failed to parse resume');
    }
  },
};
