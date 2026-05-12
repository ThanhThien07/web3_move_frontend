import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { getPaymentConfig } from '../lib/payment-config';

export interface User {
  username: string;
  wallet_address?: string;
  favorites?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('itc-library-user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const account = useCurrentAccount();

  // Sync wallet address with backend if account changes and user is logged in
  useEffect(() => {
    if (user && account && user.wallet_address !== account.address) {
      const config = getPaymentConfig();
      // Wallet changed, update backend
      fetch(`${config.booksApiBaseUrl}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, wallet_address: account.address })
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const updatedUser = { ...user, wallet_address: account.address };
          setUser(updatedUser);
          localStorage.setItem('itc-library-user', JSON.stringify(updatedUser));
        }
      })
      .catch(err => console.error('Failed to sync wallet address', err));
    }
  }, [account, user]);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('itc-library-user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('itc-library-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
