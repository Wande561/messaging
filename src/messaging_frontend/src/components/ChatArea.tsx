import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Send, MoreVertical, Search, RefreshCw, Trash2, Archive, Bell, BellOff, UserX, ChevronUp, ChevronDown, X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AppContext";
import { Principal } from "@dfinity/principal";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string;
  sender?: Principal;
  receiver?: Principal;
}

interface ChatAreaProps {
  conversationId?: string; 
  conversationName?: string;
  conversationAvatar?: string;
  isOnline?: boolean;
  onMessageSent?: () => void;
  onBackClick?: () => void;
  isMobile?: boolean;
}

export function ChatArea({ 
  conversationId,
  conversationName = "Select Conversation", 
  conversationAvatar = "/placeholder.svg",
  isOnline = true,
  onMessageSent,
  onBackClick,
  isMobile = false
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isNotificationMuted, setIsNotificationMuted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const { sendMessage, getMessages, getUser, identity } = useAuth();

  useEffect(() => {
    if (conversationId && identity) {
      loadMessages();
      loadUserInfo();
    }
  }, [conversationId, identity]);

  const loadMessages = async () => {
    if (!conversationId || !identity) return;
    
    setIsLoading(true);
    try {
      const otherPrincipal = Principal.fromText(conversationId);
      const messagesData = await getMessages(otherPrincipal);
      
      if (messagesData) {
        const formattedMessages: Message[] = messagesData.map((msg: any, index: number) => ({
          id: index.toString(),
          content: msg.text,
          timestamp: new Date(Number(msg.timestamp) / 1000000).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isOwn: msg.sender && identity ? msg.sender.toText() === identity.getPrincipal().toText() : false,
          sender: msg.sender,
          receiver: msg.receiver,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserInfo = async () => {
    if (!conversationId){
      console.log("Cannot load user info: No conversationId");
      return;
    }

    try {
      const otherPrincipal = Principal.fromText(conversationId);
      const userData = await getUser(otherPrincipal);
      setUserInfo(userData);
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const handleRefresh = async () => {
    if (!conversationId || !identity) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all([loadMessages(), loadUserInfo()]);
    } catch (error) {
      console.error("Error refreshing chat:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this chat? This action cannot be undone.")) {
      setMessages([]);
      console.log("Chat cleared for conversation:", conversationId);
    }
  };

  const handleArchiveChat = () => {
    console.log("Archive chat for conversation:", conversationId);
    alert("Chat archived (feature coming soon)");
  };

  const handleBlockUser = () => {
    if (window.confirm(`Are you sure you want to block ${userInfo?.username || conversationName}?`)) {
      console.log("Block user for conversation:", conversationId);
      alert("User blocked (feature coming soon)");
    }
  };

  const handleToggleNotifications = () => {
    setIsNotificationMuted(!isNotificationMuted);
    console.log(`Notifications ${!isNotificationMuted ? 'muted' : 'unmuted'} for:`, conversationId);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setCurrentSearchIndex(-1);
    }
  };

  const handleSearchMessages = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: number[] = [];
    messages.forEach((message, index) => {
      if (message.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);

    if (results.length > 0) {
      scrollToMessage(results[0]);
    }
  };

  const handleSearchNext = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex]);
  };

  const handleSearchPrevious = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex]);
  };

  const scrollToMessage = (messageIndex: number) => {
    const messageElement = document.getElementById(`message-${messageIndex}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      messageElement.classList.add('bg-yellow-200');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-200');
      }, 2000);
    }
  };

  const highlightSearchText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !identity) return;
    
    setIsLoading(true);
    try {
      const otherPrincipal = Principal.fromText(conversationId);
      const success = await sendMessage(otherPrincipal, newMessage.trim());
      
      if (success) {
        setNewMessage("");
        await loadMessages();
        if (onMessageSent) {
          onMessageSent();
        }
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white w-full">
      {/* Chat Header */}
      <div className="p-3 md:p-4 border-card-border bg-blue-300 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* Mobile back button */}
            {isMobile && onBackClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackClick}
                className="h-9 w-9 text-navy hover:bg-blue-200 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
              <AvatarImage src={conversationAvatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {conversationName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm md:text-base text-navy text-foreground truncate">
                {conversationId ? (userInfo?.username || conversationName) : "Select Conversation"}
              </h3>
              <p className="text-xs md:text-sm text-white text-muted-foreground truncate">
                {conversationId && userInfo?.online ? "Active now" : conversationId ? "Last seen recently" : "Choose a conversation to start messaging"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-muted-foreground hover:bg-blue-200 hover:text-foreground"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh messages"
            >
              <RefreshCw className={`h-4 text-navy w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-9 w-9 text-muted-foreground hover:bg-blue-200 hover:text-foreground ${isSearchOpen ? 'bg-blue-200' : ''}`}
              onClick={handleSearchToggle}
              title="Search messages"
            >
              <Search className="h-4 text-navy w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-blue-200 hover:text-foreground">
                  <MoreVertical className="h-4 text-navy w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleToggleNotifications}>
                  {isNotificationMuted ? (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Unmute notifications
                    </>
                  ) : (
                    <>
                      <BellOff className="mr-2 h-4 w-4" />
                      Mute notifications
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchiveChat}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearChat} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlockUser} className="text-red-600 focus:text-red-600">
                  <UserX className="mr-2 h-4 w-4" />
                  Block user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      {isSearchOpen && (
        <div className="p-3 border-b border-card-border bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearchMessages(e.target.value)}
                className="pr-20"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-sm text-gray-500">
                {searchResults.length > 0 && (
                  <span>{currentSearchIndex + 1} of {searchResults.length}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchPrevious}
                disabled={searchResults.length === 0}
                title="Previous result"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchNext}
                disabled={searchResults.length === 0}
                title="Next result"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchToggle}
                title="Close search"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : !conversationId ? (
          <div className="flex justify-center items-center h-full text-gray-500 px-4 text-center">
            <p className="text-sm md:text-base">Select a conversation to start messaging</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500 px-4 text-center">
            <p className="text-sm md:text-base">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              id={`message-${index}`}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"} transition-colors duration-200`}
            >
              <div className={`flex gap-2 md:gap-3 max-w-[85%] md:max-w-[70%] ${message.isOwn ? "flex-row-reverse" : "flex-row"}`}>
                {!message.isOwn && (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-1 flex-shrink-0">
                    <AvatarImage src={userInfo?.profilePicture || conversationAvatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {(userInfo?.username || conversationName).split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${message.isOwn ? "items-end" : "items-start"} flex-1 min-w-0`}>
                  <div
                    className={`px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-message transition-all duration-200 hover:shadow-lg break-words ${
                      message.isOwn
                        ? "bg-blue-300 text-white" // own messages: grey bubble, navy text
                        : "bg-gray-200 text-navy " // received: lighter grey, navy text
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">
                      {highlightSearchText(message.content, searchQuery)}
                    </p>
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1 px-2">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 md:p-4 bg-white backdrop-blur-sm border-t">
        <div className="flex gap-2 md:gap-3 items-end">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-blue-50 border-input-border text-blue-900 min-h-[40px] md:min-h-[44px] resize-none rounded-xl text-sm md:text-base"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || !conversationId}
            className="h-10 w-10 md:h-11 md:w-11 flex-shrink-0 bg-gradient-to-br from-blue-300 to-blue-400 hover:bg-gradient-purple-glow transition-all duration-200 disabled:opacity-50 shadow-purple"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
            ) : (
              <Send className="h-4 w-4 text-blue-900" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}