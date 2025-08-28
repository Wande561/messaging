import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { useAuth } from './AppContext';

export interface WalletTransaction {
  id: string;
  type: 'send' | 'receive' | 'fee';
  amount: number;
  to?: string;
  from?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  memo?: string;
  blockHeight?: number;
}

export interface WalletBalance {
  icp: number;
  usd: number; 
}

interface WalletContextType {
  balance: WalletBalance;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;

  refreshBalance: () => Promise<void>;
  sendICP: (to: string, amount: number, memo?: string) => Promise<boolean>;
  getTransactions: () => Promise<void>;

  formatICP: (amount: number) => string;
  formatUSD: (amount: number) => string;
  validateAddress: (address: string) => boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { identity } = useAuth();
  const [balance, setBalance] = useState<WalletBalance>({ icp: 0, usd: 0 });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ICP_TO_USD_RATE = 8.5;

  const formatICP = (amount: number): string => {
    return `${(amount / 100000000).toFixed(8)} ICP`;
  };

  const formatUSD = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const validateAddress = (address: string): boolean => {
    try {
      Principal.fromText(address);
      return true;
    } catch {
      return /^[a-fA-F0-9]{64}$/.test(address);
    }
  };

  const refreshBalance = async (): Promise<void> => {
    if (!identity) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mockICPBalance = Math.random() * 10;
      const usdValue = mockICPBalance * ICP_TO_USD_RATE;
      
      setBalance({
        icp: mockICPBalance * 100000000,
        usd: usdValue
      });
    } catch (err) {
      setError('Failed to fetch balance');
      console.error('Balance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendICP = async (to: string, amount: number, memo?: string): Promise<boolean> => {
    if (!identity) {
      setError('Not authenticated');
      return false;
    }

    if (!validateAddress(to)) {
      setError('Invalid recipient address');
      return false;
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    if (amount > balance.icp) {
      setError('Insufficient balance');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newTransaction: WalletTransaction = {
        id: transactionId,
        type: 'send',
        amount: amount,
        to: to,
        timestamp: new Date(),
        status: 'pending',
        memo: memo,
      };

      setTransactions(prev => [newTransaction, ...prev]);

      setTimeout(() => {
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === transactionId 
              ? { ...tx, status: 'completed' as const, blockHeight: Math.floor(Math.random() * 1000000) }
              : tx
          )
        );

        setBalance(prev => ({
          icp: prev.icp - amount - 10000,
          usd: (prev.icp - amount - 10000) / 100000000 * ICP_TO_USD_RATE
        }));
      }, 2000);

      return true;
    } catch (err) {
      setError('Failed to send transaction');
      console.error('Send transaction error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactions = async (): Promise<void> => {
    if (!identity) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mockTransactions: WalletTransaction[] = [
        {
          id: 'tx_1',
          type: 'receive',
          amount: 50000000, 
          from: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
          timestamp: new Date(Date.now() - 86400000), 
          status: 'completed',
          memo: 'Payment for services',
          blockHeight: 123456
        },
        {
          id: 'tx_2',
          type: 'send',
          amount: 25000000, 
          to: 'rrkah-fqaaa-aaaah-qcaiq-cai',
          timestamp: new Date(Date.now() - 172800000),
          status: 'completed',
          memo: 'Transfer to friend',
          blockHeight: 123400
        },
        {
          id: 'tx_3',
          type: 'fee',
          amount: 10000, 
          timestamp: new Date(Date.now() - 172800000),
          status: 'completed',
          blockHeight: 123400
        }
      ];

      setTransactions(mockTransactions);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Transaction fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (identity) {
      refreshBalance();
      getTransactions();
    } else {
      setBalance({ icp: 0, usd: 0 });
      setTransactions([]);
      setError(null);
    }
  }, [identity]);

  const value: WalletContextType = {
    balance,
    transactions,
    isLoading,
    error,
    refreshBalance,
    sendICP,
    getTransactions,
    formatICP,
    formatUSD,
    validateAddress
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
