import axios, { AxiosError } from 'axios';
import { STORAGE_KEYS } from '@/lib/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (!token) {
    throw new Error('Not authenticated. Please connect your wallet first.');
  }
  return { Authorization: `Bearer ${token}` };
};

export interface StudentProfileData {
  githubUsername: string;
  gpa: number;
  internships: number;
  resume: File;
}

export interface StudentProfile {
  walletAddress: string;
  githubUsername: string;
  gpa: number;
  internships: number;
  resumeHash: string;
  creditScore: number;
  maxBorrowingLimit: string;
  availableCredit: string;
  interestRate: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  currentBorrowed: string;
  totalBorrowed: string;
  totalRepaid: string;
  defaultCount: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submit student profile for credit scoring
 */
export const submitProfile = async (
  profileData: StudentProfileData
): Promise<StudentProfile> => {
  try {
    const formData = new FormData();
    formData.append('githubUsername', profileData.githubUsername);
    formData.append('gpa', profileData.gpa.toString());
    formData.append('internships', profileData.internships.toString());
    formData.append('resume', profileData.resume);

    const response = await axios.post(
      `${API_URL}/student-profile/profile`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders(),
        },
      }
    );

    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    console.error('Error submitting profile:', error);
    throw new Error(
      axiosError.response?.data?.message || 'Failed to submit profile'
    );
  }
};

/**
 * Get student profile and credit data
 */
export const getProfile = async (): Promise<StudentProfile | null> => {
  try {
    const response = await axios.get(
      `${API_URL}/student-profile/profile`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.status === 404) {
      return null;
    }
    console.error('Error fetching profile:', error);
    throw new Error(
      axiosError.response?.data?.message || 'Failed to fetch profile'
    );
  }
};

/**
 * Refresh credit score and borrowing limits
 */
export const refreshScore = async (): Promise<StudentProfile> => {
  try {
    const response = await axios.post(
      `${API_URL}/student-profile/refresh-score`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    console.error('Error refreshing score:', error);
    throw new Error(
      axiosError.response?.data?.message || 'Failed to refresh score'
    );
  }
};
