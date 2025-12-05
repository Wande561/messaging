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
import { canisterId as iiCanId } from "../../../declarations/internet_identity";
import { Actor, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
import { canisterId, idlFactory } from "../../../declarations/messaging_backend";
import { _SERVICE } from "../../../declarations/messaging_backend/messaging_backend.did";

let network = "local";
if (typeof process !== "undefined" && process.env && process.env.DFX_NETWORK) {
  network = process.env.DFX_NETWORK;
} else if (typeof window !== "undefined" && window.location.host.includes("localhost")) {
  network = "local";
} else if (typeof window !== "undefined" && window.location.host.includes("icp0.io")) {
  network = "ic";
}

const localhost = "http://localhost:4943";
const host = network === "local" ? localhost : "https://icp0.io";

interface ContextType {
  isAuthenticated: boolean | null;
  backendActor: ActorSubclass<_SERVICE> | null;
  identity: Identity | null;
  currentUser: any | null;
  login: () => void;
  logout: () => void;
  registerUser: (username: string) => Promise<any>;
  searchUsers: (keyword: string) => Promise<any>;
  sendMessage: (receiver: any, text: string) => Promise<boolean>;
  getMessages: (other: any) => Promise<any[]>;
  getUser: (principal: any) => Promise<any>;
  getUserConversations: () => Promise<any[]>;
}

const initialContext: ContextType = {
  identity: null,
  backendActor: null,
  isAuthenticated: false,
  currentUser: null,
  login: (): void => {},
  logout: (): void => {},
  registerUser: async () => null,
  searchUsers: async () => [],
  sendMessage: async () => false,
  getMessages: async () => [],
  getUser: async () => null,
  getUserConversations: async () => [],
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
  },
};

export const useAuthClient = (options = defaultOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [backendActor, setBackendActor] =
    useState<ActorSubclass<_SERVICE> | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  const serializeUser = (user: any) => {
    return JSON.parse(JSON.stringify(user, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const client = await AuthClient.create(options.createOptions);
      await updateClient(client);
    } catch (error) {
      console.error("Auth initialization failed:", error);
    }
  };

  const login = () => {
    authClient?.login({
      ...options.loginOptions,
      onSuccess: () => {
        updateClient(authClient);
      },
    });
  };

  async function updateClient(client: AuthClient) {
    try {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
      setAuthClient(client);

      const _identity = client.getIdentity();
      setIdentity(_identity);

      let agent = new HttpAgent({
        host: host,
        identity: _identity,
      });

      if (network === "local") {
        try {
          await agent.fetchRootKey();
          console.log("Successfully fetched root key for local development");
        } catch (error) {
          console.error("Failed to fetch root key:", error);
          throw new Error("Cannot connect to local replica. Make sure dfx is running.");
        }
      }

      const _backendActor: ActorSubclass<_SERVICE> = Actor.createActor(
        idlFactory,
        {
          agent,
          canisterId: canisterId,
        }
      );
      setBackendActor(_backendActor);

      if (isAuthenticated) {
        await restoreUserSession(_backendActor, _identity);
      }
    } catch (error) {
      console.error("Failed to update client:", error);
    }
  }

  const restoreUserSession = async (actor: ActorSubclass<_SERVICE>, identity: Identity) => {
    try {
      const principal = identity.getPrincipal();

      const storedUser = localStorage.getItem('messagingAppUser');
      let userFromStorage = null;
      
      if (storedUser) {
        try {
          userFromStorage = JSON.parse(storedUser);
          console.log("Found stored user data, validating with backend...");
        } catch (error) {
          console.warn("Invalid stored user data, clearing localStorage");
          localStorage.removeItem('messagingAppUser');
        }
      }

      const userData = await actor.getUser(principal);
      
      if (userData && userData.length > 0) {
        const user = { 
          principal: principal.toString(),
          ...userData[0] 
        };
        const serializedUser = serializeUser(user);

        setCurrentUser(serializedUser);

        localStorage.setItem('messagingAppUser', JSON.stringify(serializedUser));
        
        console.log("User session restored successfully:", serializedUser.username);
        
        // After user is restored, we can restore conversation state
        // This will be handled by the Index component when it detects currentUser is set
        
      } else {
        if (userFromStorage) {
          console.warn("User no longer exists in backend, clearing stored data");
          localStorage.removeItem('messagingAppUser');
          localStorage.removeItem('selectedConversationId');
        }
        

        setCurrentUser(null);
        console.log("New user detected - registration required for rewards");
      }
    } catch (error) {
      console.error("Failed to restore user session:", error);
      localStorage.removeItem('messagingAppUser');
      localStorage.removeItem('selectedConversationId');
      setCurrentUser(null);
    }
  }

  async function logout() {
    try {
      await authClient?.logout();
      setCurrentUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedConversationId');
        localStorage.removeItem('messagingAppUser');
      }
      if (authClient) {
        await updateClient(authClient);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const registerUser = async (username: string) => {
    if (!backendActor || !identity) return null;
    try {
      const result = await backendActor.registerUser(username);
      if ('ok' in result) {
        const user = {
          principal: identity.getPrincipal().toString(),
          username: username,
          profilePicture: "",
          status: "Available",
        };
        const serializedUser = serializeUser(user);
        setCurrentUser(serializedUser);
        localStorage.setItem('messagingAppUser', JSON.stringify(serializedUser));

        console.log("✅ " + result.ok);
        
        return result;
      }
      return result;
    } catch (err) {
      console.error("registerUser error:", err);
      return { err: "Registration failed" };
    }
  };

  const searchUsers = async (keyword: string) => {
    if (!backendActor) return [];
    try {
      return await backendActor.searchUsers(keyword);
    } catch (err) {
      console.error("searchUsers error:", err);
      return [];
    }
  };

  const sendMessage = async (receiver: any, text: string) => {
    if (!backendActor || !identity) return false;
    try {
      const result = await backendActor.sendMessage(receiver, text);
      return 'ok' in result;
    } catch (err) {
      console.error("sendMessage error:", err);
      return false;
    }
  };

  const getMessages = async (other: any) => {
    if (!backendActor || !identity) return [];
    try {
      return await backendActor.getMessages(identity.getPrincipal(), other);
    } catch (err) {
      console.error("getMessages error:", err);
      return [];
    }
  };

  const getUser = async (principal: any) => {
    if (!backendActor) return null;
    try {
      const result = await backendActor.getUser(principal);
      return result.length > 0 ? result[0] : null;
    } catch (err) {
      console.error("getUser error:", err);
      return null;
    }
  };

  const getUserConversations = async () => {
    if (!backendActor || !identity) {
      return [];
    }
    try {
      const conversations = await backendActor.getUserMessages(identity.getPrincipal());
      return conversations;
    } catch (err) {
      console.error("getUserConversations error:", err);
      return [];
    }
  };

  return {
    isAuthenticated,
    backendActor,
    login,
    logout,
    identity,
    currentUser,
    registerUser,
    searchUsers,
    sendMessage,
    getMessages,
    getUser,
    getUserConversations,
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