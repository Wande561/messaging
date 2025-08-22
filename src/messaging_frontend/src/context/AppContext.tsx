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

const network = "local";
const localhost = "http://localhost:4943";
const host = "https://icp0.io";
  
  interface ContextType {
    isAuthenticated: boolean | null;
    backendActor: ActorSubclass<_SERVICE> | null;
    identity: Identity | null;
    login: () => void;
    logout: () => void;
  }

  const initialContext: ContextType = {
    identity: null,
    backendActor: null,
    isAuthenticated: false,
    login: (): void => {},
    logout: (): void => {},
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
        host + "/#authorize", // Always use main II for now
    },
  };
  
  export const useAuthClient = (options = defaultOptions) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [authClient, setAuthClient] = useState<AuthClient | null>(null);
    const [backendActor, setBackendActor] =
      useState<ActorSubclass<_SERVICE> | null>(null);
    const [identity, setIdentity] = useState<Identity | null>(null);

    useEffect(() => {
      AuthClient.create(options.createOptions).then(async (client) => {
        updateClient(client);
      });
    }, []);
  
    const login = () => {
      authClient?.login({
        ...options.loginOptions,
        onSuccess: () => {
          updateClient(authClient);
        },
      });
    };

  
    async function updateClient(client: AuthClient) {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
  
      setAuthClient(client);
  
      const _identity = client.getIdentity();
      setIdentity(_identity);

      let agent = new HttpAgent({
        host: network === "local" ? localhost : host,
        identity: _identity,
      });
  
      if (network === "local") {
        agent.fetchRootKey();
      }
  
      const _backendActor: ActorSubclass<_SERVICE> = Actor.createActor(
        idlFactory,
        {
          agent,
          canisterId: canisterId,
        }
      );
      setBackendActor(_backendActor);
    }
  
    
  
    async function logout() {
      await authClient?.logout();
      if (authClient) {
        await updateClient(authClient);
      }
    }
  
    return {
      isAuthenticated,
      backendActor,
      login,
      logout,
      identity,
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
