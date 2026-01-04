import api from './api';
import { STORAGE_KEYS } from '@/lib/constants';
import type { ApiResponse, NonceResponse, LoginRequest, LoginResponse, TokenVerifyResponse } from '@/types/api.types';

class AuthService {
  /**
   * Get nonce for wallet signature
   */
  async getNonce(address: string): Promise<string> {
    const response = await api.post<ApiResponse<NonceResponse>>('/auth/nonce', { address });
    if (response.data.success && response.data.data) {
      return response.data.data.nonce;
    }
    throw new Error('Failed to get nonce');
  }

  /**
   * Login with wallet signature
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', loginData);
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      
      // Store auth data
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, user.address);
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, user.role);
      
      return response.data.data;
    }
    
    throw new Error('Login failed');
  }

  /**
   * Verify JWT token
   */
  async verifyToken(): Promise<TokenVerifyResponse> {
    const response = await api.get<ApiResponse<TokenVerifyResponse>>('/auth/verify');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Token verification failed');
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get stored wallet address
   */
  getWalletAddress(): string | null {
    return localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
  }

  /**
   * Get stored user role
   */
  getUserRole(): 'student' | 'investor' | null {
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    return role as 'student' | 'investor' | null;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

export default new AuthService();
