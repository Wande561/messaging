import { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { createActor, canisterId } from '../../../declarations/kotomo';
import { Account, TransferArg, TransferResult, TransferError, Transaction } from '../../../declarations/kotomo/kotomo.did';
import { useAuth } from '../context/AppContext';

// Use the environment variable for the canister ID
const KOTOMO_CANISTER_ID = canisterId;

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  fee: bigint;
  totalSupply: bigint;
}

export interface FormattedTransferResult {
  success: boolean;
  transactionId?: bigint;
  error?: string;
}

export const useStandaloneICRC1 = () => {
  const { identity } = useAuth();
  const [tokenActor, setTokenActor] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the token actor
  useEffect(() => {
    const initActor = async () => {
      try {
        const actor = createActor(KOTOMO_CANISTER_ID, {
          agentOptions: {
            host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943",
            ...(identity && { identity }),
          },
        });
        setTokenActor(actor);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize ICRC-1 token actor:', error);
        setIsInitialized(false);
      }
    };

    if (identity) {
      initActor();
    }
  }, [identity]);

  // Get token information
  const getTokenInfo = async (): Promise<TokenInfo> => {
    if (!tokenActor) throw new Error('Token actor not initialized');

    try {
      const [name, symbol, decimals, fee, totalSupply] = await Promise.all([
        tokenActor.icrc1_name(),
        tokenActor.icrc1_symbol(),
        tokenActor.icrc1_decimals(),
        tokenActor.icrc1_fee(),
        tokenActor.icrc1_total_supply(),
      ]);

      return { name, symbol, decimals, fee, totalSupply };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  };

  // Get balance for current user
  const getBalance = async (): Promise<bigint> => {
    if (!tokenActor || !identity) throw new Error('Token actor or identity not available');

    const account: Account = {
      owner: identity.getPrincipal(),
      subaccount: [],
    };

    try {
      return await tokenActor.icrc1_balance_of(account);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  };

  // Get balance for any principal
  const getBalanceOf = async (principal: Principal): Promise<bigint> => {
    if (!tokenActor) throw new Error('Token actor not initialized');

    const account: Account = {
      owner: principal,
      subaccount: [],
    };

    return await tokenActor.icrc1_balance_of(account);
  };

  // Transfer tokens
  const transfer = async (
    to: Principal, 
    amount: bigint, 
    memo?: string
  ): Promise<FormattedTransferResult> => {
    if (!tokenActor || !identity) throw new Error('Token actor or identity not available');

    const account: Account = {
      owner: to,
      subaccount: [],
    };

    const args: TransferArg = {
      from_subaccount: [],
      to: account,
      amount: amount,
      fee: [],
      memo: memo ? [Array.from(new TextEncoder().encode(memo))] : [],
      created_at_time: [BigInt(Date.now() * 1000000)], // Convert to nanoseconds
    };

    try {
      const result: TransferResult = await tokenActor.icrc1_transfer(args);

      if ('Ok' in result) {
        return {
          success: true,
          transactionId: result.Ok,
        };
      } else {
        const error = result.Err;
        let errorMessage = 'Transfer failed';
        
        if ('BadFee' in error) {
          errorMessage = `Incorrect fee. Expected: ${error.BadFee.expected_fee}`;
        } else if ('InsufficientFunds' in error) {
          errorMessage = `Insufficient funds. Balance: ${error.InsufficientFunds.balance}`;
        } else if ('GenericError' in error) {
          errorMessage = `Error: ${error.GenericError.message}`;
        } else if ('BadBurn' in error) {
          errorMessage = `Bad burn amount. Minimum: ${error.BadBurn.min_burn_amount}`;
        } else if ('TooOld' in error) {
          errorMessage = 'Transaction too old';
        } else if ('CreatedInFuture' in error) {
          errorMessage = `Transaction created in future. Ledger time: ${error.CreatedInFuture.ledger_time}`;
        } else if ('Duplicate' in error) {
          errorMessage = `Duplicate transaction. Original: ${error.Duplicate.duplicate_of}`;
        } else if ('TemporarilyUnavailable' in error) {
          errorMessage = 'Service temporarily unavailable';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Transfer error:', error);
      return {
        success: false,
        error: 'Network error or invalid transaction',
      };
    }
  };

  // Format tokens for display (considering decimals)
  const formatTokens = (amount: bigint, decimals: number = 8): string => {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fractional = amount % divisor;
    
    // Remove trailing zeros from fractional part
    let fractionalStr = fractional.toString().padStart(decimals, '0');
    fractionalStr = fractionalStr.replace(/0+$/, '');
    
    if (fractionalStr === '') {
      return whole.toString();
    }
    
    return `${whole}.${fractionalStr}`;
  };

  // Parse tokens from display format to token amount
  const parseTokens = (amount: string, decimals: number = 8): bigint => {
    const parts = amount.split('.');
    const whole = BigInt(parts[0] || '0');
    const fractional = parts[1] || '0';
    const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
    const multiplier = BigInt(10 ** decimals);
    return whole * multiplier + BigInt(fractionalPadded);
  };

  // Get supported standards
  const getSupportedStandards = async () => {
    if (!tokenActor) throw new Error('Token actor not initialized');
    try {
      return await tokenActor.icrc1_supported_standards();
    } catch (error) {
      console.error('Error getting supported standards:', error);
      throw error;
    }
  };

  // Convert principal to account format
  const principalToAccount = (principal: Principal): Account => {
    return {
      owner: principal,
      subaccount: [],
    };
  };

  // Get transaction history using standard ICRC-1 interface
  const getTransactions = async (start: bigint = 0n, length: bigint = 100n): Promise<Transaction[]> => {
    if (!tokenActor) throw new Error('Token actor not initialized');
    try {
      const response = await tokenActor.get_transactions({ start, length });
      return response.transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  };

  // Get all transaction history (limited by the length parameter)
  const getAllTransactions = async (maxTransactions: bigint = 1000n): Promise<Transaction[]> => {
    if (!tokenActor) throw new Error('Token actor not initialized');
    try {
      const response = await tokenActor.get_transactions({ start: 0n, length: maxTransactions });
      return response.transactions;
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw error;
    }
  };

  // Get transaction count from the log length
  const getTransactionCount = async (): Promise<bigint> => {
    if (!tokenActor) throw new Error('Token actor not initialized');
    try {
      const response = await tokenActor.get_transactions({ start: 0n, length: 1n });
      return response.log_length;
    } catch (error) {
      console.error('Error getting transaction count:', error);
      throw error;
    }
  };

  // Get transactions for current user (filter from all transactions)
  const getUserTransactions = async (): Promise<Transaction[]> => {
    if (!tokenActor || !identity) throw new Error('Token actor or identity not initialized');
    try {
      const userPrincipal = identity.getPrincipal();
      const allTransactions = await getAllTransactions();
      
      // Filter transactions where user is involved (sender or receiver)
      return allTransactions.filter(tx => {
        if (tx.transfer && tx.transfer.length > 0) {
          const transfer = tx.transfer[0];
          return transfer && (
            transfer.from.owner.toString() === userPrincipal.toString() ||
            transfer.to.owner.toString() === userPrincipal.toString()
          );
        }
        if (tx.mint && tx.mint.length > 0) {
          const mint = tx.mint[0];
          return mint && mint.to.owner.toString() === userPrincipal.toString();
        }
        if (tx.burn && tx.burn.length > 0) {
          const burn = tx.burn[0];
          return burn && burn.from.owner.toString() === userPrincipal.toString();
        }
        return false;
      });
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  };

  return {
    // State
    isInitialized,
    tokenActor,
    
    // Functions
    getTokenInfo,
    getBalance,
    getBalanceOf,
    transfer,
    formatTokens,
    parseTokens,
    getSupportedStandards,
    principalToAccount,
    
    // Transaction history
    getTransactions,
    getAllTransactions,
    getTransactionCount,
    getUserTransactions,
  };
};
