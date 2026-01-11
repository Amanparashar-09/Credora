import axios from 'axios';
import { logger } from '../utils/logger';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000/score';
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

/**
 * Calculate credit limit based on credit score
 * Score is expected to be 0-100 range from AI engine
 */
function calculateCreditLimitFromScore(score: number): number {
  // Normalize score to 0-100 range
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  if (normalizedScore < 20) {
    return 500;  // Very low score: $500
  } else if (normalizedScore < 40) {
    return 1000; // Low score: $1,000
  } else if (normalizedScore < 60) {
    return 2500; // Medium score: $2,500
  } else if (normalizedScore < 80) {
    return 5000; // Good score: $5,000
  } else {
    return 10000; // Excellent score: $10,000
  }
}

function getRiskLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score < 30) return 'high';
  if (score < 60) return 'medium';
  return 'low';
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

      // If AI engine doesn't provide credit_limit, calculate it from score
      if (!result.credit_limit || result.credit_limit === 0) {
        result.credit_limit = calculateCreditLimitFromScore(result.credora_score);
      }
      
      // If AI engine doesn't provide risk_level, calculate it from score
      if (!result.risk_level) {
        result.risk_level = getRiskLevelFromScore(result.credora_score);
      }
      
      // Set defaults for optional fields
      if (!result.factors) {
        result.factors = ['AI Analysis'];
      }
      if (!result.confidence) {
        result.confidence = 0.75;
      }

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
