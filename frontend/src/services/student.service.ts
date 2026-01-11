import api from './api';
import type {
  ApiResponse,
  StudentProfile,
  CreditStatus,
  CreditHistory,
  BorrowingStatus,
  Transaction,
  StudentDashboard,
  Document,
  DocumentUploadResponse,
  SubmitScoringResponse,
  OnboardingData,
} from '@/types/api.types';

class StudentService {
  /**
   * Get student profile
   */
  async getProfile(): Promise<StudentProfile> {
    const response = await api.get<ApiResponse<StudentProfile>>('/student/profile');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch profile');
  }

  /**
   * Update student profile
   */
  async updateProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
    const response = await api.put<ApiResponse<StudentProfile>>('/student/profile', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to update profile');
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(data: OnboardingData): Promise<StudentProfile> {
    const response = await api.post<ApiResponse<StudentProfile>>('/student/onboard', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to complete onboarding');
  }

  /**
   * Upload document (encrypted)
   */
  async uploadDocument(file: File, documentType: string): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const response = await api.post<ApiResponse<DocumentUploadResponse>>(
      '/student/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to upload document');
  }

  /**
   * Get all documents
   */
  async getDocuments(): Promise<Document[]> {
    const response = await api.get<ApiResponse<{ documents: Document[] }>>('/student/documents');
    if (response.data.success && response.data.data) {
      return response.data.data.documents;
    }
    throw new Error('Failed to fetch documents');
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await api.get(`/student/documents/${documentId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Submit for AI credit scoring
   */
  async submitForScoring(): Promise<SubmitScoringResponse> {
    const response = await api.post<ApiResponse<SubmitScoringResponse>>('/student/submit-for-scoring');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to submit for scoring');
  }

  /**
   * Get attestation data for on-chain registration
   */
  async getAttestationData(): Promise<{
    user: string;
    score: number;
    creditLimit: string;
    expiry: number;
    nonce: number;
    signature: string;
  }> {
    const response = await api.get<ApiResponse<{
      user: string;
      score: number;
      creditLimit: string;
      expiry: number;
      nonce: number;
      signature: string;
    }>>('/student/attestation-data');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to get attestation data');
  }

  /**
   * Get credit status
   */
  async getCreditStatus(): Promise<CreditStatus> {
    const response = await api.get<ApiResponse<CreditStatus>>('/student/credit-status');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch credit status');
  }

  /**
   * Get credit history
   */
  async getCreditHistory(): Promise<CreditHistory[]> {
    const response = await api.get<ApiResponse<{ history: CreditHistory[] }>>('/student/credit-history');
    if (response.data.success && response.data.data) {
      return response.data.data.history;
    }
    throw new Error('Failed to fetch credit history');
  }

  /**
   * Get borrowing status
   */
  async getBorrowingStatus(): Promise<BorrowingStatus> {
    const response = await api.get<ApiResponse<BorrowingStatus>>('/student/borrowing-status');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch borrowing status');
  }

  /**
   * Get borrowing history (transactions)
   */
  async getBorrowingHistory(): Promise<Transaction[]> {
    const response = await api.get<ApiResponse<{ transactions: Transaction[] }>>('/student/borrowing-history');
    if (response.data.success && response.data.data) {
      return response.data.data.transactions;
    }
    throw new Error('Failed to fetch borrowing history');
  }

  /**
   * Get dashboard data (combined)
   */
  async getDashboard(): Promise<StudentDashboard> {
    const response = await api.get<ApiResponse<StudentDashboard>>('/student/dashboard');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch dashboard');
  }

  /**
   * Borrow funds from the pool
   */
  async borrowFunds(amount: number): Promise<{ message: string; contractAddress: string; method: string; params: unknown[] }> {
    const response = await api.post<ApiResponse<{ message: string; contractAddress: string; method: string; params: unknown[] }>>('/student/borrow', { amount });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to process borrow request');
  }

  /**
   * Repay loan
   */
  async repayLoan(amount: number): Promise<{ message: string; contractAddress: string; method: string; params: unknown[] }> {
    const response = await api.post<ApiResponse<{ message: string; contractAddress: string; method: string; params: unknown[] }>>('/student/repay', { amount });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to process repayment');
  }

  /**
   * Pay individual slice (EMI installment)
   */
  async paySlice(sliceId: string, amount: number): Promise<{ message: string; contractAddress: string; method: string; params: unknown[] }> {
    const response = await api.post<ApiResponse<{ message: string; contractAddress: string; method: string; params: unknown[] }>>('/student/pay-slice', { sliceId, amount });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to process slice payment');
  }
}

export default new StudentService();
