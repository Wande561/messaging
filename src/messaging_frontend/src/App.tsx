import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SignupPage } from "./pages/Signup";
import { LoginPage } from "./pages/Login";
import { useAuth } from "./context/AppContext";
import { WalletProvider } from "./context/WalletContext";

const queryClient = new QueryClient();

interface UserData {
  email: string;
  username: string;
  status: string;
  profilePicture: File | null;
  profilePictureUrl: string;
}

const App = () => {
  const { isAuthenticated, identity, checkUserExists } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  const handleSignupComplete = (userData: UserData) => {
    setUser(userData);
    setHasProfile(true);
  };

  // Check for existing user profile when authenticated
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (isAuthenticated && identity && !hasProfile && !isCheckingProfile) {
        setIsCheckingProfile(true);
        try {
          console.log("Checking for existing user profile...");
          const existingUser = await checkUserExists();
          if (existingUser) {
            console.log("Found existing user profile:", existingUser);
            setUser({
              email: "", // We don't store email in backend
              username: existingUser.username,
              status: existingUser.status,
              profilePicture: null,
              profilePictureUrl: existingUser.profilePicture || "",
            });
            setHasProfile(true);
          } else {
            console.log("No existing user profile found");
          }
        } catch (error) {
          console.error("Error checking existing profile:", error);
        } finally {
          setIsCheckingProfile(false);
        }
      }
    };

    checkExistingProfile();
  }, [isAuthenticated, identity, hasProfile, isCheckingProfile, checkUserExists]);

  // Show loading state while checking authentication or profile
  if (isAuthenticated === null || (isAuthenticated && isCheckingProfile)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isAuthenticated === null ? "Loading..." : "Checking profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route 
                path="/" 
                element={
                  !isAuthenticated ? (
                    <LoginPage />
                  ) : !hasProfile ? (
                    <SignupPage onSignupComplete={handleSignupComplete} />
                  ) : (
                    <Index user={user} />
                  )
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;