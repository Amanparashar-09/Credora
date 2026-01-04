import api from './api';
import type {
  ApiResponse,
  InvestorProfile,
  Pool,
  PoolStats,
  Portfolio,
  InvestorBalance,
  Returns,
  Analytics,
  InvestorDashboard,
} from '@/types/api.types';

class InvestorService {
  /**
   * Get investor profile
   */
  async getProfile(): Promise<InvestorProfile> {
    const response = await api.get<ApiResponse<InvestorProfile>>('/investor/profile');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch profile');
  }

  /**
   * Update investor profile
   */
  async updateProfile(data: Partial<InvestorProfile>): Promise<InvestorProfile> {
    const response = await api.put<ApiResponse<InvestorProfile>>('/investor/profile', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to update profile');
  }

  /**
   * Get all pools
   */
  async getPools(): Promise<Pool[]> {
    const response = await api.get<ApiResponse<{ pools: Pool[] }>>('/investor/pools');
    if (response.data.success && response.data.data) {
      return response.data.data.pools;
    }
    throw new Error('Failed to fetch pools');
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(poolAddress: string): Promise<PoolStats> {
    const response = await api.get<ApiResponse<PoolStats>>(`/investor/pools/${poolAddress}/stats`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch pool stats');
  }

  /**
   * Get portfolio
   */
  async getPortfolio(): Promise<Portfolio> {
    const response = await api.get<ApiResponse<Portfolio>>('/investor/portfolio');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch portfolio');
  }

  /**
   * Get balance (USDT + shares)
   */
  async getBalance(): Promise<InvestorBalance> {
    const response = await api.get<ApiResponse<InvestorBalance>>('/investor/balance');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch balance');
  }

  /**
   * Get returns/earnings
   */
  async getReturns(): Promise<Returns> {
    const response = await api.get<ApiResponse<Returns>>('/investor/returns');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch returns');
  }

  /**
   * Get analytics
   */
  async getAnalytics(): Promise<Analytics> {
    const response = await api.get<ApiResponse<Analytics>>('/investor/analytics');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch analytics');
  }

  /**
   * Get dashboard data (combined)
   */
  async getDashboard(): Promise<InvestorDashboard> {
    const response = await api.get<ApiResponse<InvestorDashboard>>('/investor/dashboard');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch dashboard');
  }
}

export default new InvestorService();
