import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Settings, LogOut, UserPlus, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AppContext";
import { useState, useCallback } from "react";
import { Principal } from "@dfinity/principal";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  avatar?: string;
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

interface ConversationSidebarProps {
  selectedConversationId?: string | null;
  onConversationSelect: (id: string) => void;
  onSettingsClick?: () => void;
  onAddUserClick?: () => void;
  onWalletClick?: () => void;
}

export function ConversationSidebar({ selectedConversationId, onConversationSelect, onSettingsClick, onAddUserClick, onWalletClick }: ConversationSidebarProps) {
  const { logout, searchUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const handleLogout = () => {
    logout();
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      if (results) {
        const formattedResults: SearchResult[] = results.map(([principal, user]) => ({
          principal,
          user
        }));
        setSearchResults(formattedResults);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchUsers]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleStartConversation = (result: SearchResult) => {
    // Convert principal to string to use as conversation ID
    const conversationId = result.principal.toText();
    onConversationSelect(conversationId);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blue-900">Messages</h2>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onAddUserClick}
              className="h-8 w-8 text-blue-900 hover:text-blue-700 hover:bg-gray-100"
              title="Add New Contact"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onWalletClick}
              className="h-8 w-8 text-blue-900 hover:text-blue-700 hover:bg-gray-100"
              title="Wallet"
            >
              <Wallet className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSettingsClick}
              className="h-8 w-8 text-blue-900 hover:text-blue-700 hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-900" />
          <Input
            placeholder="Search users..."
            className="pl-10 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900"
            value={searchQuery}
            onChange={handleSearchInputChange}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <div className="border-b border-gray-200 bg-gray-50 max-h-48 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No users found
              </div>
            ) : (
              searchResults.map((result) => (
                <div
                  key={result.principal.toText()}
                  onClick={() => handleStartConversation(result)}
                  className="flex items-center gap-3 p-2 cursor-pointer hover:bg-white rounded-lg transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.user.profilePicture} />
                      <AvatarFallback className="bg-blue-100 text-blue-900">
                        {result.user.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {result.user.online && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {result.user.username}
                      </h4>
                      <UserPlus className="h-3 w-3 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {result.user.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 h-6 overflow-y-auto">
        {!showSearchResults && (
          <>
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Recent Conversations
              </h3>
            </div>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-blue-900 font-medium mb-2">No conversations yet</p>
                <p className="text-sm text-blue-600 mb-4">Start by adding someone to chat with</p>
                <Button 
                  onClick={onAddUserClick}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 ${
                    selectedConversationId === conversation.id 
                      ? "bg-blue-50 border-l-4 border-l-blue-500" 
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-900">
                        {conversation.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-small text-blue-900 truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-gray-600">
                          {conversation.timestamp}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount && (
                          <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}