import { useEffect, useState } from "react";
import { useAuth } from "../context/AppContext";
import { PublicUser } from "../../../declarations/messaging_backend/messaging_backend.did";
import { Principal } from "@dfinity/principal";
import { MessageSquare } from "lucide-react";
import ProfileSetup from "./ProfileSetup";
import { useNavigate } from "react-router-dom"; 
import { Button } from "../components/ui/button";

function Login() {
  const { backendActor, login, logout, isAuthenticated, identity } = useAuth();
  const [users, setUsers] = useState<[Principal, PublicUser][]>([]);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const navigate = useNavigate();
  
  const refreshData = async () => {
    if (!backendActor || !identity) return;
    console.log("Login: refreshData called, fetching user data...");
    
    try {
      const [allUsers, me] = await Promise.all([
        backendActor.searchUsers(""),
        backendActor.getUser(identity.getPrincipal()),
      ]);
      
      console.log("Login: fetched allUsers:", allUsers);
      console.log("Login: fetched me:", me);
      
      if (allUsers) setUsers(allUsers);
      if (me.length > 0 && me[0]) {
        console.log("Login: User is registered, setting currentUser and navigating to chat");
        setCurrentUser(me[0]);
        // After profile is complete, navigate to chat
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

  // Auto-redirect to chat if user is already registered
  useEffect(() => {
    if (currentUser) {
      navigate('/chat');
    }
  }, [currentUser, navigate]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase();

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
          </section>

          {/* If user not registered, show profile setup */}
          {!currentUser && (
            <ProfileSetup onComplete={refreshData} />
          )}

          {/* Users List */}
          {users.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                Community Members ({users.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(([principal, user], index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-900 font-bold">
                        {getInitials(user.username)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">
                          {user.username}
                        </h4>
                        <p className="text-sm text-gray-600">{user.status}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.online ? "bg-green-400" : "bg-gray-300"
                            }`}
                          />
                          <span className="text-xs text-gray-500">
                            {user.online ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
