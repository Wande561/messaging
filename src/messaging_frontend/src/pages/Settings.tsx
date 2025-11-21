import { useState, useEffect } from "react";
import { useAuth } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, User, Mail, Camera, LogOut } from "lucide-react";
import { PublicUser } from "../../../declarations/messaging_backend/messaging_backend.did";

function Settings() {
  const { backendActor, identity, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  useEffect(() => {
    const loadUserData = async () => {
      if (!backendActor || !identity) return;
      
      try {
        setLoading(true);
        const user = await backendActor.getUser(identity.getPrincipal());
        if (user && user.length > 0) {
          const userData = user[0];
          setCurrentUser(userData ?? null);
          setUsername(userData?.username ?? "");
          setStatus(userData?.status ?? "");
        }
      } catch (err) {
        console.log("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (backendActor && isAuthenticated && identity) {
      loadUserData();
    }
  }, [backendActor, isAuthenticated, identity]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backendActor || !identity) return;

    try {
      setSaving(true);
      const result = await backendActor.updateProfile(
        username,
        "", // Empty string for profile picture since we're not using it
        status
      );
      
      if (result) {
        const updatedUser = await backendActor.getUser(identity.getPrincipal());
        if (updatedUser && updatedUser.length > 0) {
          setCurrentUser(updatedUser[0] ?? null);
        }
      }
    } catch (err) {
      console.log("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-blue-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/chat')}
            variant="ghost"
            size="icon"
            className="text-blue-900 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-blue-900">Settings</h1>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-6">Profile Settings</h2>
          
          {/* Profile Picture */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={""} />
                <AvatarFallback className="bg-blue-100 text-blue-900 text-xl">
                  {currentUser ? getInitials(currentUser.username) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 text-lg">{currentUser?.username}</h3>
              <p className="text-gray-600">{currentUser?.status}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${currentUser?.online ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-500">
                  {currentUser?.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-blue-900 font-medium">
                Username
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-900" />
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-blue-900 font-medium">
                Status Message
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-900" />
                <Textarea
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="pl-10 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900 resize-none"
                  placeholder="What's on your mind?"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="principalId" className="text-blue-900 font-medium">
                Principal ID
              </Label>
              <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                <p className="text-sm text-gray-900 font-mono break-all">
                  {identity?.getPrincipal().toText() || 'Not available'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is your unique identifier on the Internet Computer
              </p>
            </div>

            <Button
              type="submit"
              disabled={saving || !username}
              className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
            >
              {saving ? "Saving..." : "Update Profile"}
            </Button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-6">Account</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Account Created</h3>
                <p className="text-sm text-gray-600">
                  {currentUser?.createdAt ? new Date(Number(currentUser.createdAt) / 1000000).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Last Active</h3>
                <p className="text-sm text-gray-600">
                  {currentUser?.lastSeen ? new Date(Number(currentUser.lastSeen) / 1000000).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
