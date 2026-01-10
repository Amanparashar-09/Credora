import { useState, useEffect } from 'react';
import authService from '@/services/auth.service';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (address: string, signature: string, message: string, role: 'student' | 'investor') => Promise<void>;
  logout: () => void;
  verifyAuth: () => Promise<boolean>;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          await authService.verifyToken();
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        authService.logout();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (address: string, signature: string, message: string, role: 'student' | 'investor') => {
    try {
      await authService.login({ address, signature, message, role });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const verifyAuth = async (): Promise<boolean> => {
    try {
      await authService.verifyToken();
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      return false;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    verifyAuth,
  };
};
