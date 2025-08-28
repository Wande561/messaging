import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search, UserPlus, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/context/AppContext";
import { Principal } from "@dfinity/principal";

interface AddUserPageProps {
  onBack: () => void;
  onStartConversation: (userId: string) => void;
}

interface SearchResult {
  principal: Principal;
  user: {
    username: string;
    profilePicture: string;
    status: string;
    online: boolean;
  };
}

export function AddUserPage({ onBack, onStartConversation }: AddUserPageProps) {
  const { searchUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchUsers(searchQuery);
      if (results) {
        const formattedResults: SearchResult[] = results.map(([principal, user]) => ({
          principal,
          user
        }));
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = (result: SearchResult) => {
    const conversationId = result.principal.toText();
    onStartConversation(conversationId);
    onBack(); // Go back to main chat view
  };

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
            <h1 className="text-xl font-semibold text-blue-900">Add New Contact</h1>
            <p className="text-sm text-blue-600">Find and connect with other users</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto pb-8">
        {/* Search Section */}
        <Card className="bg-white border-blue-200 shadow-sm mb-6">
          <CardHeader className="border-b border-blue-100">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Users
            </CardTitle>
            <CardDescription className="text-blue-600">
              Enter a username to find users to chat with
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-blue-900 font-medium">Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter username to search..."
                    className="flex-1 border-blue-200 focus:border-blue-500 text-blue-900"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader className="border-b border-blue-100">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Search Results
              </CardTitle>
              <CardDescription className="text-blue-600">
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} user${searchResults.length === 1 ? '' : 's'}`
                  : 'No users found'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={result.user.profilePicture} />
                          <AvatarFallback className="bg-blue-200 text-blue-900">
                            {result.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-blue-900">{result.user.username}</h3>
                          </div>
                          {result.user.status && (
                            <p className="text-sm text-blue-600 mt-1">{result.user.status}</p>
                          )}
                          <p className="text-xs text-blue-500 mt-1 font-mono">
                            ID: {result.principal.toText().slice(0, 20)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartConversation(result)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                    </div>
                  ))}
                </div>
              ) : hasSearched && !isSearching ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                  <p className="text-blue-600 mb-2">No users found with that username</p>
                  <p className="text-sm text-blue-500">Try searching with a different username</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        {!hasSearched && (
          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader className="border-b border-blue-100">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                How to Add Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-blue-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Search for Users</p>
                    <p className="text-sm text-blue-600">Enter the exact username of the person you want to chat with</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Start Conversation</p>
                    <p className="text-sm text-blue-600">Click "Start Chat" to begin messaging with them</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Chat Instantly</p>
                    <p className="text-sm text-blue-600">Your conversation will appear in the sidebar and you can start messaging immediately</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
