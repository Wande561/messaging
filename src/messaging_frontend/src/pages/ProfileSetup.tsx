// src/pages/ProfileSetup.tsx
import { useState } from "react";
import { useAuth } from "../context/AppContext";
import { User, Mail } from "lucide-react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

interface Props {
  onComplete: () => void;
}

function ProfileSetup({ onComplete }: Props) {
  const { backendActor, identity } = useAuth();

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [saving, setSaving] = useState(false);

  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendActor && identity) {
      try {
        setSaving(true);
        const result = await backendActor.registerUser(
          username,
          identity.getPrincipal()
        );
        if (result) {
          await backendActor.updateProfile(
            username,
            profilePicture,
            status || "Available",
            identity.getPrincipal()
          );
          onComplete(); // refresh users + current user
        }
      } catch (err) {
        console.log("Error registering user:", err);
      } finally {
        setSaving(false);
      }
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
            Profile Picture URL (Optional)
          </Label>
          <Input
            type="url"
            id="profilePicture"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
            className="mt-1 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900"
            placeholder="https://example.com/avatar.jpg"
          />
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
