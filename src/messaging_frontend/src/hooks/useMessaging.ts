import { useState, useCallback } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { useAuth } from '../context/AppContext';
import { canisterId as messagingCanisterId } from '../../../declarations/messaging_backend';
import { idlFactory as messagingIdlFactory } from '../../../declarations/messaging_backend/messaging_backend.did.js';
import type { 
  _SERVICE as MessagingService,
} from '../../../declarations/messaging_backend/messaging_backend.did';

export function useMessaging() {
  const { identity } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create messaging backend actor
  const createMessagingActor = useCallback(async (): Promise<MessagingService | null> => {
    if (!identity || !messagingCanisterId) return null;

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
          await agent.fetchRootKey();
        } catch (err) {
          console.warn("Continuing without root key verification");
        }
      }

      const messagingActor = Actor.createActor<MessagingService>(messagingIdlFactory, {
        agent,
        canisterId: messagingCanisterId,
      });

      return messagingActor;
    } catch (err) {
      console.error('Failed to create messaging actor:', err);
      return null;
    }
  }, [identity]);

  // Register user and get sign-up reward
  const registerUser = useCallback(async (username: string): Promise<string | null> => {
    if (!identity) return null;

    try {
      setLoading(true);
      setError(null);

      const actor = await createMessagingActor();
      if (!actor) {
        throw new Error('Failed to connect to messaging backend');
      }

      const result = await actor.registerUser(username);
      
      if ('ok' in result) {
        console.log('User registered successfully:', result.ok);
        return result.ok; // This should include the sign-up reward message
      } else {
        const errorMsg = result.err;
        console.error('Registration failed:', errorMsg);
        if (errorMsg === "User already registered") {
          // User is already registered, this is not an error for our purposes
          return "Welcome back! You're already registered.";
        }
        setError(errorMsg);
        return null;
      }
    } catch (err) {
      console.error('Failed to register user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to register user';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [identity, createMessagingActor]);

  // Check if user exists
  const checkUserExists = useCallback(async (): Promise<boolean> => {
    if (!identity) return false;

    try {
      const actor = await createMessagingActor();
      if (!actor) return false;

      const user = await actor.getUser(identity.getPrincipal());
      return user !== null;
    } catch (err) {
      console.error('Failed to check user existence:', err);
      return false;
    }
  }, [identity, createMessagingActor]);

  // Get user message count for reward tracking
  const getUserMessageCount = useCallback(async (): Promise<number> => {
    if (!identity) return 0;

    try {
      const actor = await createMessagingActor();
      if (!actor) return 0;

      const count = await actor.getUserMessageCount(identity.getPrincipal());
      return Number(count);
    } catch (err) {
      console.error('Failed to get message count:', err);
      return 0;
    }
  }, [identity, createMessagingActor]);

  // Get reward configuration
  const getRewardConfig = useCallback(async () => {
    try {
      const actor = await createMessagingActor();
      if (!actor) return null;

      const config = await actor.getRewardConfig();
      return {
        signUpReward: Number(config.signUpReward),
        messageReward: Number(config.messageReward),
        messageThreshold: Number(config.messageThreshold),
      };
    } catch (err) {
      console.error('Failed to get reward config:', err);
      return null;
    }
  }, [createMessagingActor]);

  return {
    loading,
    error,
    registerUser,
    checkUserExists,
    getUserMessageCount,
    getRewardConfig,
  };
}