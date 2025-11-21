import { useEffect, useState } from "react";
import { useAuth } from "../context/AppContext";
import { PublicUser } from "../../../declarations/messaging_backend/messaging_backend.did";
import { MessageSquare } from "lucide-react";
import ProfileSetup from "./ProfileSetup";
import { useNavigate } from "react-router-dom"; 
import { Button } from "../components/ui/button";

function Login() {
  const { backendActor, login, logout, isAuthenticated, identity } = useAuth();
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const navigate = useNavigate();
  
  const refreshData = async () => {
    if (!backendActor || !identity) return;
    console.log("Login: refreshData called, fetching user data...");
    
    try {
      const me = await backendActor.getUser(identity.getPrincipal());
      
      console.log("Login: fetched me:", me);
      
      if (me.length > 0 && me[0]) {
        console.log("Login: User is registered, setting currentUser and navigating to chat");
        setCurrentUser(me[0]);
        navigate('/chat');
      } else {
        console.log("Login: User not registered, staying on profile setup");
      }
    } catch (err) {
      console.log("Error refreshing data:", err);
    }
  };

  useEffect(() => {
    if (backendActor && isAuthenticated && identity) {
      console.log("Login: User authenticated, checking registration status...");
      console.log("Login: Principal:", identity.getPrincipal().toText());
      refreshData();
    }
  }, [isAuthenticated, backendActor, identity]);

  useEffect(() => {
    if (currentUser) {
      navigate('/chat');
    }
  }, [currentUser, navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {isAuthenticated ? (
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-blue-900">Engage</h1>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Logout
            </Button>
          </div>

          {/* Welcome Section */}
          <section className="text-center mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              {currentUser
                ? `Welcome back, ${currentUser.username}!`
                : "Hi there!"}
            </h2>
            <p className="text-gray-600">
              {currentUser
                ? "Ready to start messaging?"
                : "Complete your profile to get started"}
            </p>
            {currentUser && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-700 font-medium">
                  Check your ICRC-1 wallet for token balance
                </span>
              </div>
            )}
          </section>

          {/* If user not registered, show profile setup */}
          {!currentUser && (
            <ProfileSetup onComplete={refreshData} />
          )}
        </div>
      ) : (
        // Not authenticated: show login
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <MessageSquare className="h-12 w-12 text-blue-500" />
              <h1 className="text-4xl font-bold text-blue-900">Engage</h1>
            </div>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              Welcome to Engage
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Connect with others through secure messaging powered by Internet
              Identity
            </p>
            <Button
              onClick={login}
              className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200"
            >
              Login with Internet Identity
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Login;
