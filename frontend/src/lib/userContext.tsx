import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService from "@/services/auth.service";

export type UserRole = "student" | "investor" | null;

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  isConnected: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load stored auth on mount
  useEffect(() => {
    const storedRole = authService.getUserRole();
    const storedAddress = authService.getWalletAddress();
    const hasToken = authService.isAuthenticated();

    if (hasToken && storedRole && storedAddress) {
      setRole(storedRole);
      setWalletAddress(storedAddress);
      setIsAuthenticated(true);
    }
  }, []);

  const logout = () => {
    authService.logout();
    setRole(null);
    setWalletAddress(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider
      value={{
        role,
        setRole,
        walletAddress,
        setWalletAddress,
        isConnected: !!walletAddress,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
