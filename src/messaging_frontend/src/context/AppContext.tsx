import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    FC,
  } from "react";
  import {
    AuthClient,
    AuthClientCreateOptions,
    AuthClientLoginOptions,
  } from "@dfinity/auth-client";
  import { Actor, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
  import { idlFactory } from "../../../declarations/messaging_backend";

// Hardcoded canister IDs to avoid environment variable issues
const iiCanId = "uxrrr-q7777-77774-qaaaq-cai";
const canisterId = "u6s2n-gx777-77774-qaaba-cai";
import { _SERVICE } from "../../../declarations/messaging_backend/messaging_backend.did";
import { Principal } from "@dfinity/principal";

const network = "local";
const localhost = "http://127.0.0.1:4943";
const host = "https://icp0.io";
  
  interface ContextType {
    isAuthenticated: boolean | null;
    backendActor: ActorSubclass<_SERVICE> | null;
    identity: Identity | null;
    login: () => void;
    logout: () => void;
    searchUsers: (keyword: string) => Promise<Array<[Principal, any]> | null>;
    registerUser: (username: string) => Promise<boolean>;
    updateProfile: (username: string, profilePicture: string, status: string) => Promise<boolean>;
    getUserMessages: () => Promise<Array<[Principal, any]> | null>;
    getUser: (principal: Principal) => Promise<any | null>;
    sendMessage: (receiver: Principal, text: string) => Promise<boolean>;
    getMessages: (other: Principal) => Promise<any[] | null>;
    searchMessages: (searchTerm: string) => Promise<Array<[Principal, any[]]> | null>;
    checkUserExists: () => Promise<any | null>;
  }

  const initialContext: ContextType = {
    identity: null,
    backendActor: null,
    isAuthenticated: false,
    login: (): void => {},
    logout: (): void => {},
    searchUsers: async (): Promise<Array<[Principal, any]> | null> => null,
    registerUser: async (): Promise<boolean> => false,
    updateProfile: async (): Promise<boolean> => false,
    getUserMessages: async (): Promise<Array<[Principal, any]> | null> => null,
    getUser: async (): Promise<any | null> => null,
    sendMessage: async (): Promise<boolean> => false,
    getMessages: async (): Promise<any[] | null> => null,
    searchMessages: async (): Promise<Array<[Principal, any[]]> | null> => null,
    checkUserExists: async (): Promise<any | null> => null,
  };
  
  const AuthContext = createContext<ContextType>(initialContext);
  
  interface DefaultOptions {
    createOptions: AuthClientCreateOptions;
    loginOptions: AuthClientLoginOptions;
  }
  
    const defaultOptions: DefaultOptions = {
    createOptions: {
      idleOptions: {
        disableIdle: true,
      },
    },
    loginOptions: {
      identityProvider: 
        network === "ic"
          ? "https://identity.ic0.app/#authorize"
          : `http://${iiCanId}.localhost:4943`,
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 1 week
    },
  };
  
  export const useAuthClient = (options = defaultOptions) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [authClient, setAuthClient] = useState<AuthClient | null>(null);
    const [backendActor, setBackendActor] =
      useState<ActorSubclass<_SERVICE> | null>(null);
    const [identity, setIdentity] = useState<Identity | null>(null);

    async function updateClient(client: AuthClient) {
      try {
        const isAuthenticated = await client.isAuthenticated();
        console.log("Updating client, authenticated:", isAuthenticated);
        setIsAuthenticated(isAuthenticated);
    
        setAuthClient(client);
    
        const _identity = client.getIdentity();
        setIdentity(_identity);
        console.log("Identity principal:", _identity.getPrincipal().toText());

        let agent = new HttpAgent({
          host: network === "local" ? localhost : host,
          identity: _identity,
        });
    
        if (network === "local") {
          console.log("Fetching root key for local development");
          try {
            await agent.fetchRootKey();
            console.log("Root key fetched successfully");
          } catch (error) {
            console.warn("Failed to fetch root key, but continuing:", error);
            // Continue without root key - some operations might still work
          }
        }
    
        console.log("Creating backend actor with canisterId:", canisterId);
        const _backendActor: ActorSubclass<_SERVICE> = Actor.createActor(
          idlFactory,
          {
            agent,
            canisterId: canisterId,
          }
        );
        setBackendActor(_backendActor);
        console.log("Backend actor created successfully");
      } catch (error) {
        console.error("Error updating client:", error);
        setIsAuthenticated(false);
        setBackendActor(null);
      }
    }

    useEffect(() => {
      console.log("Initializing AuthClient with canister IDs:", {
        iiCanId,
        backendCanisterId: canisterId,
        network,
        localhost,
        host
      });
      AuthClient.create(options.createOptions).then(async (client) => {
        setAuthClient(client);
        
        // Check if user is already authenticated
        const isAuthenticated = await client.isAuthenticated();
        console.log("Initial authentication check:", isAuthenticated);
        
        if (isAuthenticated) {
          updateClient(client);
        } else {
          setIsAuthenticated(false);
          setIdentity(null);
          setBackendActor(null);
        }
      });
    }, []);
  
    const login = () => {
      console.log("Starting login process...");
      console.log("AuthClient available:", !!authClient);
      console.log("Login provider:", options.loginOptions.identityProvider);
      
      if (!authClient) {
        console.error("AuthClient not available for login");
        return;
      }
      
      authClient.login({
        ...options.loginOptions,
        onSuccess: () => {
          console.log("Login successful, updating client");
          updateClient(authClient);
        },
        onError: (error: string | undefined) => {
          console.error("Login failed:", error);
        },
      });
    };

  
    async function logout() {
      await authClient?.logout();
      if (authClient) {
        await updateClient(authClient);
      }
    }

    const searchUsers = async (keyword: string): Promise<Array<[Principal, any]> | null> => {
      if (!backendActor || !isAuthenticated) {
        return null;
      }
      try {
        const results = await backendActor.searchUsers(keyword);
        return results;
      } catch (error) {
        console.error("Error searching users:", error);
        return null;
      }
    };

    const registerUser = async (username: string): Promise<boolean> => {
      if (!backendActor || !isAuthenticated || !identity) {
        console.error("Registration failed: missing requirements", {
          backendActor: !!backendActor,
          isAuthenticated,
          identity: !!identity
        });
        return false;
      }
      try {
        const principal = identity.getPrincipal();
        console.log("Attempting to register user:", {
          username,
          principal: principal.toText()
        });
        const result = await backendActor.registerUser(username, principal);
        console.log("Registration result:", result);
        
        if (!result) {
          console.warn("Registration failed - user may already exist");
          // Check if user already exists
          const existingUser = await backendActor.getUser(principal);
          if (existingUser) {
            console.log("User already exists:", existingUser);
            return true; // Treat as success if user already exists
          }
        }
        
        return result;
      } catch (error) {
        console.error("Error registering user:", error);
        return false;
      }
    };

    const updateProfile = async (username: string, profilePicture: string, status: string): Promise<boolean> => {
      if (!backendActor || !isAuthenticated || !identity) {
        return false;
      }
      try {
        const principal = identity.getPrincipal();
        const result = await backendActor.updateProfile(username, profilePicture, status, principal);
        return result;
      } catch (error) {
        console.error("Error updating profile:", error);
        return false;
      }
    };

    const getUserMessages = async (): Promise<Array<[Principal, any]> | null> => {
      if (!backendActor || !isAuthenticated || !identity) {
        return null;
      }
      try {
        const principal = identity.getPrincipal();
        const result = await backendActor.getUserMessages(principal);
        return result;
      } catch (error) {
        console.error("Error getting user messages:", error);
        return null;
      }
    };

    const getUser = async (principal: Principal): Promise<any | null> => {
      if (!backendActor || !isAuthenticated) {
        return null;
      }
      try {
        const result = await backendActor.getUser(principal);
        return result;
      } catch (error) {
        console.error("Error getting user:", error);
        return null;
      }
    };

    const sendMessage = async (receiver: Principal, text: string): Promise<boolean> => {
      if (!backendActor || !isAuthenticated || !identity) {
        return false;
      }
      try {
        const sender = identity.getPrincipal();
        const result = await backendActor.sendMessage(receiver, text, sender);
        return result;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    };

    const getMessages = async (other: Principal): Promise<any[] | null> => {
      if (!backendActor || !isAuthenticated || !identity) {
        return null;
      }
      try {
        const caller = identity.getPrincipal();
        const result = await backendActor.getMessages(other, caller);
        return result;
      } catch (error) {
        console.error("Error getting messages:", error);
        return null;
      }
    };

    const searchMessages = async (searchTerm: string): Promise<Array<[Principal, any[]]> | null> => {
      if (!backendActor || !isAuthenticated || !identity) {
        return null;
      }
      try {
        const caller = identity.getPrincipal();
        const result = await backendActor.searchMessages(searchTerm, caller);
        return result;
      } catch (error) {
        console.error("Error searching messages:", error);
        return null;
      }
    };

    const checkUserExists = async (): Promise<any | null> => {
      if (!backendActor || !isAuthenticated || !identity) {
        return null;
      }
      try {
        const principal = identity.getPrincipal();
        const result = await backendActor.getUser(principal);
        console.log("User exists check:", result);
        return result;
      } catch (error) {
        console.error("Error checking user existence:", error);
        return null;
      }
    };

    return {
      isAuthenticated,
      backendActor,
      login,
      logout,
      identity,
      searchUsers,
      registerUser,
      updateProfile,
      getUserMessages,
      getUser,
      sendMessage,
      getMessages,
      searchMessages,
      checkUserExists,
    };
  };
  
  interface LayoutProps {
    children: React.ReactNode;
  }
  
  export const AuthProvider: FC<LayoutProps> = ({ children }) => {
    const auth = useAuthClient();
  
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
  };
  
  export const useAuth = () => useContext(AuthContext);
