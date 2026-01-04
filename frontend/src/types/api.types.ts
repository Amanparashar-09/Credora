// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  timestamp?: string;
}

// Authentication
export interface NonceResponse {
  nonce: string;
}

export interface LoginRequest {
  address: string;
  signature: string;
  nonce: string;
}

export interface LoginResponse {
  token: string;
  user: {
    address: string;
    role: 'student' | 'investor' | 'admin';
  };
}

export interface TokenVerifyResponse {
  valid: boolean;
  user: {
    address: string;
    role: 'student' | 'investor' | 'admin';
  };
}

// Student Types
export interface StudentProfile {
  walletAddress: string;
  name?: string;
  email?: string;
  university?: string;
  major?: string;
  gpa?: number;
  graduationYear?: number;
  githubUsername?: string;
  linkedinProfile?: string;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditStatus {
  score: number;
  limit: string;
  available: string;
  used: string;
  validUntil: string;
  interestRate: number;
  grade: string;
}

export interface CreditFactor {
  factor: string;
  score: number;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface CreditHistory {
  score: number;
  limit: string;
  timestamp: string;
  reason: string;
}

export interface BorrowingStatus {
  totalBorrowed: string;
  principal: string;
  interest: string;
  nextPaymentDue: string;
  nextPaymentAmount: string;
}

export interface Transaction {
  id: string;
  type: 'borrow' | 'repay';
  amount: string;
  timestamp: string;
  txHash: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface StudentDashboard {
  profile: StudentProfile;
  credit: CreditStatus;
  borrowing: BorrowingStatus;
  recentTransactions: Transaction[];
  badges: Badge[];
}

export interface Badge {
  name: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
}

export interface Document {
  _id: string;
  fileName: string;
  documentType: string;
  verified: boolean;
  uploadedAt: string;
}

export interface SubmitScoringResponse {
  message: string;
  estimatedTime: string;
  requestId: string;
}

// Investor Types
export interface InvestorProfile {
  walletAddress: string;
  name?: string;
  email?: string;
  totalInvested: string;
  totalReturns: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pool {
  address: string;
  name: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  apy: string;
  totalLiquidity: string;
  totalBorrowed: string;
  utilizationRate: number;
  yourInvestment: string;
  studentsFunded: number;
}

export interface PoolStats {
  totalLiquidity: string;
  totalBorrowed: string;
  totalShares: string;
  utilizationRate: number;
  currentInterestRate: string;
  reserveFunds: string;
}

export interface Portfolio {
  totalValue: string;
  pools: {
    poolAddress: string;
    poolName: string;
    invested: string;
    shares: string;
    currentValue: string;
    apy: number;
  }[];
}

export interface InvestorBalance {
  usdtBalance: string;
  totalShares: string;
  portfolioValue: string;
}

export interface Returns {
  totalEarned: string;
  monthlyAverage: string;
  withdrawable: string;
  breakdown: {
    poolName: string;
    earned: string;
    percentage: number;
  }[];
}

export interface Analytics {
  totalInvestment: string;
  totalReturns: string;
  roi: number;
  riskScore: string;
  performanceHistory: {
    date: string;
    value: string;
    returns: string;
  }[];
}

export interface InvestorDashboard {
  profile: InvestorProfile;
  portfolio: Portfolio;
  balance: InvestorBalance;
  returns: Returns;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'investment' | 'return' | 'withdrawal';
  description: string;
  amount: string;
  timestamp: string;
  txHash?: string;
}

// Onboarding
export interface OnboardingData {
  name: string;
  email: string;
  university: string;
  major: string;
  gpa: number;
  graduationYear: number;
  githubUsername?: string;
  linkedinProfile?: string;
  workExperience?: string;
  skills?: string[];
  certifications?: string[];
}
