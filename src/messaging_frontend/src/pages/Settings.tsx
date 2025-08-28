import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Save, User, Bell, Shield, Palette } from "lucide-react";
import { useAuth } from "@/context/AppContext";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const authContext = useAuth();
  console.log('Settings - Auth context:', {
    identity: !!authContext.identity,
    isAuthenticated: authContext.isAuthenticated,
    getUser: !!authContext.getUser,
    backendActor: !!authContext.backendActor
  });
  
  const { identity, updateProfile, getUser } = authContext;
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    console.log('Settings useEffect triggered, identity:', !!identity);
    if (identity) {
      loadUserProfile();
    } else {
      console.log('No identity available, setting loading to false');
      setLoading(false);
    }
  }, [identity]);

  const loadUserProfile = async () => {
    console.log('loadUserProfile called, identity:', !!identity);
    if (!identity) {
      console.log('No identity in loadUserProfile, exiting');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const principal = identity.getPrincipal();
      console.log('Loading profile for principal:', principal.toText());
      console.log('getUser function available:', !!getUser);
      
      const profile = await getUser(principal);
      console.log('Loaded user profile:', profile);
      
      if (profile) {
        setUserProfile(profile);
        setUsername(profile.username || '');
        setStatus(profile.status || '');
        setProfilePicture(profile.profilePicture || '');
        console.log('Updated form fields:', {
          username: profile.username,
          status: profile.status,
          profilePicture: profile.profilePicture
        });
      } else {
        console.log('No profile found for user - user needs to be registered');
        // User doesn't exist, redirect to signup or show registration form
        alert('Please complete your profile setup by going through the signup process.');
        onBack(); // Go back to main app which should redirect to signup
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      alert('Failed to load profile. Please try again or contact support.');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      alert('Username is required');
      return;
    }

    setSaving(true);
    try {
      const success = await updateProfile(username, profilePicture, status);
      if (success) {
        alert('Profile updated successfully!');
        await loadUserProfile(); // Reload profile
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-900">Loading settings...</p>
          <p className="text-blue-600 text-sm mt-2">
            Identity: {identity ? 'Available' : 'Not available'}
          </p>
          <p className="text-blue-600 text-sm">
            Profile: {userProfile ? 'Loaded' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 text-blue-900 hover:text-blue-700 hover:bg-blue-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-blue-900">Settings</h1>
            <p className="text-sm text-blue-600">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto pb-8">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white border-blue-200">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-blue-900 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 text-blue-900 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 text-blue-900 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 text-blue-900 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Profile Information</CardTitle>
                <CardDescription className="text-blue-600">
                  Update your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profilePicture || userProfile?.profilePicture} />
                      <AvatarFallback className="bg-blue-100 text-blue-900 text-lg">
                        {(username || userProfile?.username || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-white"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Profile Picture</p>
                    <p className="text-sm text-blue-600">JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>

                {/* Profile Picture URL */}
                <div className="space-y-2">
                  <Label htmlFor="profilePicture" className="text-blue-900 font-medium">Profile Picture URL</Label>
                  <Input
                    id="profilePicture"
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="border-blue-200 focus:border-blue-500 text-blue-900"
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-blue-900 font-medium">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="border-blue-200 focus:border-blue-500 text-blue-900"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-blue-900 font-medium">Status Message</Label>
                  <Textarea
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="What's your current status?"
                    rows={3}
                    className="border-blue-200 focus:border-blue-500 text-blue-900 resize-none"
                  />
                </div>

                {/* Principal ID (Read-only) */}
                {identity && (
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-medium">Principal ID</Label>
                    <Input
                      value={identity.getPrincipal().toText()}
                      readOnly
                      className="bg-blue-50 text-blue-900 border-blue-200"
                    />
                    <p className="text-xs text-blue-600">
                      This is your unique identifier on the Internet Computer
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Notification Settings</CardTitle>
                <CardDescription className="text-blue-600">
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Message Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Message Notifications</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">New Message Notifications</Label>
                        <p className="text-sm text-blue-600 mt-1">Get notified when you receive new messages</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="message-notifications"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Sound Notifications</Label>
                        <p className="text-sm text-blue-600 mt-1">Play a sound when receiving messages</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sound-notifications"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Desktop Notifications</Label>
                        <p className="text-sm text-blue-600 mt-1">Show desktop notifications for new messages</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="desktop-notifications"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Message Preview</Label>
                        <p className="text-sm text-blue-600 mt-1">Show message content in notifications</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="message-preview"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Group Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Group Message Notifications</Label>
                        <p className="text-sm text-blue-600 mt-1">Get notified for all group messages</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="group-notifications"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Mentions Only</Label>
                        <p className="text-sm text-blue-600 mt-1">Only notify when mentioned in groups</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="mentions-only"
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Group Invitations</Label>
                        <p className="text-sm text-blue-600 mt-1">Get notified when invited to groups</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="group-invitations"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Group Activity</Label>
                        <p className="text-sm text-blue-600 mt-1">Notify about members joining/leaving groups</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="group-activity"
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      // Handle saving notification settings
                      alert('Notification settings saved!');
                    }}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Privacy & Security</CardTitle>
                <CardDescription className="text-blue-600">
                  Manage your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Profile Privacy */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Profile Privacy</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Profile Picture Visibility</Label>
                        <p className="text-sm text-blue-600 mt-1">Who can see your profile picture</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-32">
                          <option value="everyone">Everyone</option>
                          <option value="contacts">Contacts Only</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Status Visibility</Label>
                        <p className="text-sm text-blue-600 mt-1">Who can see your status message</p>
                      </div>
                      <div className="flex items-center space-x-2">
                         <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-32">
                          <option value="everyone">Everyone</option>
                          <option value="contacts">Contacts Only</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Online Status</Label>
                        <p className="text-sm text-blue-600 mt-1">Show when you're online</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="online-status"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Last Seen</Label>
                        <p className="text-sm text-blue-600 mt-1">Show when you were last active</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="last-seen"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Privacy */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Message Privacy</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Who Can Message Me</Label>
                        <p className="text-sm text-blue-600 mt-1">Control who can send you messages</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-32">
                          <option value="everyone">Everyone</option>
                          <option value="contacts">Contacts Only</option>
                          <option value="nobody">Nobody</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Read Receipts</Label>
                        <p className="text-sm text-blue-600 mt-1">Let others know when you've read their messages</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="read-receipts"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Typing Indicators</Label>
                        <p className="text-sm text-blue-600 mt-1">Show when you're typing</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="typing-indicators"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Security</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Block Unknown Contacts</Label>
                        <p className="text-sm text-blue-600 mt-1">Automatically block messages from unknown users</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="block-unknown"
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Two-Factor Authentication</Label>
                        <p className="text-sm text-blue-600 mt-1">Add extra security to your account</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-blue-900 border-blue-300 hover:bg-blue-50">
                          Setup 2FA
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Blocked Users</Label>
                        <p className="text-sm text-blue-600 mt-1">Manage your blocked contacts</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-blue-900 border-blue-300 hover:bg-blue-50">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      // Handle saving privacy settings
                      alert('Privacy settings saved!');
                    }}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Privacy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Appearance</CardTitle>
                <CardDescription className="text-blue-600">
                  Customize how the app looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Theme Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Theme</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Color Theme</Label>
                        <p className="text-sm text-blue-600 mt-1">Choose your preferred color scheme</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-40">
                          <option value="navy-blue">Navy Blue (Current)</option>
                          <option value="light-blue">Light Blue</option>
                          <option value="dark-blue">Dark Blue</option>
                          <option value="purple">Purple</option>
                          <option value="green">Green</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Dark Mode</Label>
                        <p className="text-sm text-blue-600 mt-1">Switch to dark theme</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="dark-mode"
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Auto Theme</Label>
                        <p className="text-sm text-blue-600 mt-1">Automatically switch based on system preference</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="auto-theme"
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Display</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Font Size</Label>
                        <p className="text-sm text-blue-600 mt-1">Adjust text size for better readability</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-32">
                          <option value="small">Small</option>
                          <option value="medium" selected>Medium</option>
                          <option value="large">Large</option>
                          <option value="extra-large">Extra Large</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Message Density</Label>
                        <p className="text-sm text-blue-600 mt-1">Control spacing between messages</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-32">
                          <option value="compact">Compact</option>
                          <option value="normal" selected>Normal</option>
                          <option value="comfortable">Comfortable</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Chat Background</Label>
                        <p className="text-sm text-blue-600 mt-1">Choose chat background style</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-32">
                          <option value="default">Default</option>
                          <option value="gradient">Gradient</option>
                          <option value="pattern">Pattern</option>
                          <option value="solid">Solid Color</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Sidebar Width</Label>
                        <p className="text-sm text-blue-600 mt-1">Adjust conversation sidebar width</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select className="px-2 py-1 border border-blue-200 rounded-md text-blue-900 bg-white focus:border-blue-500 focus:outline-none text-sm w-24">
                          <option value="narrow">Narrow</option>
                          <option value="normal" selected>Normal</option>
                          <option value="wide">Wide</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animation Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Animations & Effects</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Enable Animations</Label>
                        <p className="text-sm text-blue-600 mt-1">Show smooth transitions and effects</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enable-animations"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Message Animations</Label>
                        <p className="text-sm text-blue-600 mt-1">Animate message appearance</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="message-animations"
                          defaultChecked
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <Label className="text-blue-900 font-medium">Reduce Motion</Label>
                        <p className="text-sm text-blue-600 mt-1">Minimize animations for accessibility</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="reduce-motion"
                          className="h-4 w-4 text-blue-500 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      // Handle saving appearance settings
                      alert('Appearance settings saved!');
                    }}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Appearance Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
