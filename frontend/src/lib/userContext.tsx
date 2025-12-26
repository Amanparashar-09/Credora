import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "investor" | null;

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  isConnected: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  return (
    <UserContext.Provider
      value={{
        role,
        setRole,
        walletAddress,
        setWalletAddress,
        isConnected: !!walletAddress,
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
