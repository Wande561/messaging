import { useState, useEffect, useCallback } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { canisterId } from '../../../declarations/kotomo';
import { idlFactory as kotomoIdlFactory } from '../../../declarations/kotomo/kotomo.did.js';
import { useAuth } from '../context/AppContext';
import type { 
  _SERVICE as KotomoService, 
  Account, 
  TransferArg, 
  TransferResult, 
  Transaction,
  GetTransactionsRequest,
  GetTransactionsResponse
} from '../../../declarations/kotomo/kotomo.did';

interface KotomoTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  fee: bigint;
}

interface KotomoTransaction {
  id: bigint;
  timestamp: bigint;
  kind: 'transfer' | 'mint' | 'burn';
  amount: bigint;
  fee?: bigint;
  from?: Principal;
  to?: Principal;
  memo?: Uint8Array | number[];
}

export function useKotomo() {
  const { identity } = useAuth();
  const [actor, setActor] = useState<KotomoService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [tokenInfo, setTokenInfo] = useState<KotomoTokenInfo | null>(null);
  const [transactions, setTransactions] = useState<KotomoTransaction[]>([]);

  useEffect(() => {
    const initializeActor = async () => {
      if (identity && canisterId) {
        try {
          const isLocalDevelopment = process.env.NODE_ENV === "development" || 
                                    process.env.DFX_NETWORK === "local" || 
                                    window.location.hostname === "localhost";
          
          const host = isLocalDevelopment ? "http://localhost:4943" : "https://ic0.app";
          
          const agent = new HttpAgent({
            host,
            identity,
            ...(isLocalDevelopment && { verifyQuerySignatures: false }),
          });

          if (isLocalDevelopment) {
            try {
              console.log("Fetching root key for local development...");
              await agent.fetchRootKey();
              console.log("Root key fetched successfully for local development");
            } catch (err) {
              console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
              console.error(err);
              console.warn("Continuing without root key verification");
            }
          }

          const kotomoActor = Actor.createActor<KotomoService>(kotomoIdlFactory, {
            agent,
            canisterId,
          });

          if (isLocalDevelopment) {
            try {
              await kotomoActor.icrc1_name();
              console.log("KOTOMO actor initialized and working properly");
            } catch (testErr) {
              console.warn("Actor test call failed, but continuing:", testErr);
            }
          }

          setActor(kotomoActor);
          setError(null);
        } catch (err) {
          console.error('Failed to create KOTOMO actor:', err);
          setError('Failed to connect to KOTOMO token');
          setActor(null);
        }
      } else {
        setActor(null);
      }
    };

    initializeActor();
  }, [identity]);

  const getUserAccount = useCallback((): Account | null => {
    if (!identity) return null;
    return {
      owner: identity.getPrincipal(),
      subaccount: [],
    };
  }, [identity]);

  const formatTokenAmount = useCallback((amount: bigint, decimals: number = 8): string => {
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '') || '0';
    return `${wholePart}.${fractionalStr}`;
  }, []);

  const parseTokenAmount = useCallback((amount: string, decimals: number = 8): bigint => {
    const [whole = '0', fractional = '0'] = amount.split('.');
    const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFractional);
  }, []);

  const loadTokenInfo = useCallback(async (): Promise<void> => {
    if (!actor) return;

    try {
      setLoading(true);
      setError(null);

      const [name, symbol, decimals, totalSupply, fee] = await Promise.all([
        actor.icrc1_name(),
        actor.icrc1_symbol(),
        actor.icrc1_decimals(),
        actor.icrc1_total_supply(),
        actor.icrc1_fee(),
      ]);

      setTokenInfo({
        name,
        symbol,
        decimals,
        totalSupply,
        fee,
      });
    } catch (err) {
      console.error('Failed to load token info:', err);
      setError('Failed to load token information');
    } finally {
      setLoading(false);
    }
  }, [actor]);

  const loadBalance = useCallback(async (): Promise<void> => {
    if (!actor || !identity) return;

    try {
      setLoading(true);
      setError(null);

      const account = getUserAccount();
      if (!account) return;

      const userBalance = await actor.icrc1_balance_of(account);
      setBalance(userBalance);
    } catch (err) {
      console.error('Failed to load balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  }, [actor, identity, getUserAccount]);

  const parseTransaction = useCallback((tx: Transaction, index: bigint): KotomoTransaction => {
    if (tx.transfer && tx.transfer.length > 0) {
      const transfer = tx.transfer[0];
      if (transfer) {
        return {
          id: index,
          timestamp: tx.timestamp,
          kind: 'transfer',
          amount: transfer.amount,
          fee: transfer.fee && transfer.fee.length > 0 ? transfer.fee[0] : undefined,
          from: transfer.from.owner,
          to: transfer.to.owner,
          memo: transfer.memo && transfer.memo.length > 0 ? transfer.memo[0] : undefined,
        };
      }
    } else if (tx.mint && tx.mint.length > 0) {
      const mint = tx.mint[0];
      if (mint) {
        return {
          id: index,
          timestamp: tx.timestamp,
          kind: 'mint',
          amount: mint.amount,
          to: mint.to.owner,
          memo: mint.memo && mint.memo.length > 0 ? mint.memo[0] : undefined,
        };
      }
    } else if (tx.burn && tx.burn.length > 0) {
      const burn = tx.burn[0];
      if (burn) {
        return {
          id: index,
          timestamp: tx.timestamp,
          kind: 'burn',
          amount: burn.amount,
          from: burn.from.owner,
          memo: burn.memo && burn.memo.length > 0 ? burn.memo[0] : undefined,
        };
      }
    }

    return {
      id: index,
      timestamp: tx.timestamp,
      kind: 'transfer',
      amount: 0n,
    };
  }, []);

  const loadTransactions = useCallback(async (): Promise<void> => {
    if (!actor || !identity) return;

    try {
      setLoading(true);
      setError(null);

      const request: GetTransactionsRequest = {
        start: 0n,
        length: 100n, 
      };

      const response: GetTransactionsResponse = await actor.get_transactions(request);

      const userPrincipal = identity.getPrincipal().toString();
      const relevantTransactions = response.transactions
        .map((tx, index) => parseTransaction(tx, BigInt(response.first_index) + BigInt(index)))
        .filter(tx => {
          return (
            tx.from?.toString() === userPrincipal ||
            tx.to?.toString() === userPrincipal
          );
        });

      setTransactions(relevantTransactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }, [actor, identity, parseTransaction]);

  const sendTokens = useCallback(async (
    to: Principal, 
    amount: bigint, 
    memo?: Uint8Array
  ): Promise<TransferResult> => {
    if (!actor || !identity) {
      throw new Error('Not connected to KOTOMO token');
    }

    const account = getUserAccount();
    if (!account) {
      throw new Error('No account available');
    }

    const transferArg: TransferArg = {
      from_subaccount: [],
      to: {
        owner: to,
        subaccount: [],
      },
      amount,
      fee: [],
      memo: memo ? [memo] : [],
      created_at_time: [],
    };

    try {
      setLoading(true);
      setError(null);

      const result = await actor.icrc1_transfer(transferArg);

      await Promise.all([loadBalance(), loadTransactions()]);
      
      return result;
    } catch (err) {
      console.error('Failed to send tokens:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send tokens';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [actor, identity, getUserAccount, loadBalance, loadTransactions]);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!actor) return;

    await Promise.all([
      loadTokenInfo(),
      loadBalance(),
      loadTransactions(),
    ]);
  }, [actor, loadTokenInfo, loadBalance, loadTransactions]);

  useEffect(() => {
    if (actor) {
      refreshData();
    }
  }, [actor, refreshData]);

  return {
    loading,
    error,
    balance,
    tokenInfo,
    transactions,
    connected: !!actor,

    formatTokenAmount,
    parseTokenAmount,
    getUserAccount,
    
    sendTokens,
    refreshData,
    loadBalance,
    loadTransactions,
    loadTokenInfo,
  };
}