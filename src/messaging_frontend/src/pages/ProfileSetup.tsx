// src/pages/ProfileSetup.tsx
import { useState, useRef } from "react";
import { useAuth } from "../context/AppContext";
import { User, Mail, Upload, Camera } from "lucide-react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

interface Props {
  onComplete: () => void;
}

function ProfileSetup({ onComplete }: Props) {
  const { backendActor, identity } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePicture(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ProfileSetup: Starting registration process...");
    console.log("ProfileSetup: Username:", username);
    console.log("ProfileSetup: Identity present:", !!identity);
    console.log("ProfileSetup: BackendActor present:", !!backendActor);
    
    if (backendActor && identity) {
      try {
        setSaving(true);
        const principal = identity.getPrincipal();
        console.log("ProfileSetup: User principal:", principal.toText());
        
        // First check if user is already registered
        console.log("ProfileSetup: Checking if user already exists...");
        const existingUser = await backendActor.getUser(principal);
        console.log("ProfileSetup: Existing user check result:", existingUser);
        
        if (existingUser && existingUser.length > 0) {
          console.log("ProfileSetup: User already registered, skipping registration");
          onComplete();
          return;
        }
        
        console.log("ProfileSetup: Calling registerUser...");
        const result = await backendActor.registerUser(username);
        
        console.log("ProfileSetup: registerUser result:", result);
        
        if ('ok' in result) {
          console.log("ProfileSetup: Calling updateProfile...");
          
          const updateResult = await backendActor.updateProfile(
            username,
            profilePicture,
            status || "Available"
          );
          
          if ('ok' in updateResult) {
            console.log("ProfileSetup: Profile updated successfully, calling onComplete...");
            onComplete(); // refresh users + current user
          } else {
            console.error("ProfileSetup: updateProfile failed:", updateResult);
          }
        } else {
          console.error("ProfileSetup: registerUser failed:", result);
        }
      } catch (err) {
        console.log("Error registering user:", err);
      } finally {
        setSaving(false);
      }
    } else {
      console.error("ProfileSetup: Missing backendActor or identity");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg mb-8">
      <h3 className="text-xl font-semibold text-blue-900 mb-6 text-center">
        Complete Your Profile
      </h3>
      <form onSubmit={registerUser} className="space-y-6">
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
              placeholder="Choose a username"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="status" className="text-blue-900 font-medium">
            Status (Optional)
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-900" />
            <Input
              type="text"
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pl-10 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900"
              placeholder="What's on your mind?"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="profilePicture" className="text-blue-900 font-medium">
            Profile Picture (Optional)
          </Label>
          <div className="mt-2 space-y-3">
            {/* Image Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-blue-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Upload Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                {imagePreview ? "Change Picture" : "Upload Picture"}
              </Button>
            </div>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {/* File Info */}
            <p className="text-xs text-blue-600 text-center">
              Supported formats: JPG, PNG, GIF (Max 5MB)
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving || !username}
          className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
        >
          {saving ? "Saving..." : "Complete Profile"}
        </Button>
      </form>
    </div>
  );
}

export default ProfileSetup;
