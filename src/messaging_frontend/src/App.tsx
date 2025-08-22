import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SignupPage } from "./pages/Signup";

const queryClient = new QueryClient();

interface UserData {
  email: string;
  username: string;
  status: string;
  profilePicture: File | null;
  profilePictureUrl: string;
}

const App = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isSignedUp, setIsSignedUp] = useState(false);

  const handleSignupComplete = (userData: UserData) => {
    setUser(userData);
    setIsSignedUp(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                isSignedUp ? 
                <Index user={user} /> : 
                <SignupPage onSignupComplete={handleSignupComplete} />
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;