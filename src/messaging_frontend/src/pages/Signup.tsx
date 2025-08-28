import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, User, Mail, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AppContext";
import { Principal } from "@dfinity/principal";

interface SignupFormData {
  email: string;
  username: string;
  status: string;
  profilePicture: File | null;
  profilePictureUrl: string;
  userMessages?: any[];
}

interface SignupPageProps {
  onSignupComplete: (userData: SignupFormData) => void;
}

export function SignupPage({ onSignupComplete }: SignupPageProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    username: "",
    status: "",
    profilePicture: null,
    profilePictureUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { backendActor, identity, logout, registerUser, updateProfile, getUserMessages, checkUserExists } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePicture: file,
          profilePictureUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !identity) return;
    setIsLoading(true);
    try {
      const principal = identity.getPrincipal().toText();
      console.log("Starting registration process for:", {
        username: formData.username,
        principal
      });
      
      // First check if user already exists
      const existingUser = await checkUserExists();
      if (existingUser) {
        console.log("User already exists, updating profile instead:", existingUser);
        // User exists, just update profile
        const profileResult = await updateProfile(
          formData.username,
          formData.profilePictureUrl || "",
          formData.status || ""
        );
        
        if (profileResult) {
          console.log("Profile update successful");
          localStorage.setItem("principal", principal);
          const userMessages = await getUserMessages();
          onSignupComplete({ ...formData, userMessages: userMessages || [] });
        } else {
          console.error("Failed to update existing user profile");
          alert("Failed to update profile. Please try again.");
        }
      } else {
        // User doesn't exist, register new user
        console.log("User doesn't exist, registering new user...");
        const registrationResult = await registerUser(formData.username);
        console.log("Registration result:", registrationResult);
        
        if (registrationResult) {
          console.log("Registration successful, updating profile...");
          // Update profile using the context function
          const profileResult = await updateProfile(
            formData.username,
            formData.profilePictureUrl || "",
            formData.status || ""
          );
          
          if (profileResult) {
            console.log("Profile update successful");
            localStorage.setItem("principal", principal);
            // Get user messages using the context function
            const userMessages = await getUserMessages();
            onSignupComplete({ ...formData, userMessages: userMessages || [] });
          } else {
            console.error("Failed to update profile");
            alert("Failed to update profile. Please try again.");
          }
        } else {
          console.error("Failed to register user");
          alert("Failed to register user. Please try again.");
        }
      }
    } catch (err) {
      console.error("Signup failed:", err);
      alert("Signup failed. Please try again.");
    }
    setIsLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-blue-900">Engage</h1>
          </div>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Join the conversation and connect with others</p>
        </div>
        <div className="mb-4 flex justify-center">
          <Button 
            type="button" 
            onClick={handleLogout} 
            variant="outline"
            className="border-blue-300 text-blue-900 hover:bg-gray-400 bg-white"
          >
            Switch Account
          </Button>
        </div>
        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.profilePictureUrl} />
                <AvatarFallback className="bg-blue-100 text-blue-900 text-xl">
                  {formData.username ? getInitials(formData.username) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profilePicture"
                className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-600">Upload your profile picture</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-blue-900 font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-900" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-blue-900 font-medium">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-900" />
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="pl-10 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-blue-900 font-medium">
              Status Message (Optional)
            </Label>
            <Textarea
              id="status"
              placeholder="What's on your mind?"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900 resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !formData.email || !formData.username || !identity}
            className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            By creating an account, you'll be automatically signed in and ready to chat!
          </p>
        </div>
      </div>
    </div>
  );
}
