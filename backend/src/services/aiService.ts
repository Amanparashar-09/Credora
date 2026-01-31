import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const AI_ENGINE_TIMEOUT = parseInt(process.env.AI_ENGINE_TIMEOUT || '30000');

export interface StudentDataForScoring {
  github_username: string;  // Required by AI
  gpa: number;             // Required by AI
  internships: number;     // Required by AI
  resumeBuffer: Buffer;    // Required by AI (PDF file)
  resumeFilename: string;  // Original filename
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
      // Validate input data
      if (!studentData.github_username || studentData.github_username.trim() === '') {
        throw new Error('GitHub username is required');
      }
      
      if (studentData.gpa === undefined || studentData.gpa === null || studentData.gpa < 0 || studentData.gpa > 10) {
        throw new Error('GPA must be between 0 and 10');
      }
      
      if (studentData.internships === undefined || studentData.internships === null || studentData.internships < 0) {
        throw new Error('Internships must be a non-negative number');
      }
      
      if (!studentData.resumeBuffer || studentData.resumeBuffer.length === 0) {
        throw new Error('Resume PDF buffer is empty');
      }

      logger.info('Requesting credit score from AI engine', {
        github_username: studentData.github_username,
        gpa: studentData.gpa,
        internships: studentData.internships,
        resumeSize: studentData.resumeBuffer.length,
        resumeFilename: studentData.resumeFilename,
      });

      // Create form data as expected by AI engine
      const formData = new FormData();
      formData.append('github_username', studentData.github_username);
      formData.append('gpa', studentData.gpa.toString());
      formData.append('internships', studentData.internships.toString());
      formData.append('resume', studentData.resumeBuffer, {
        filename: studentData.resumeFilename,
        contentType: 'application/pdf',
      });

      const response = await axios.post(
        `${AI_ENGINE_URL}/score`,
        formData,
        {
          timeout: AI_ENGINE_TIMEOUT,
          headers: {
            ...formData.getHeaders(),
            ...(process.env.AI_ENGINE_API_KEY && {
              'Authorization': `Bearer ${process.env.AI_ENGINE_API_KEY}`,
            }),
          },
        }
      );

      const result: CreditScoreResponse = response.data;

      logger.info('🔥 AI Engine Response Received', {
        raw_response: JSON.stringify(response.data),
        credora_score: result.credora_score,
      });

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
