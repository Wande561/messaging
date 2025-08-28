import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MoreVertical, Phone, Video, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AppContext";
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
  conversationId?: string; // This will be the Principal ID as string
  conversationName?: string;
  conversationAvatar?: string;
  isOnline?: boolean;
}

export function ChatArea({ 
  conversationId,
  conversationName = "Select a conversation",
  conversationAvatar = "/placeholder.svg",
  isOnline = true 
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { sendMessage, getMessages, getUser, identity } = useAuth();

  // Load messages when conversation changes
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
          isOwn: msg.sender.toText() === identity.getPrincipal().toText(),
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
    if (!conversationId) return;
    
    try {
      const otherPrincipal = Principal.fromText(conversationId);
      const userData = await getUser(otherPrincipal);
      setUserInfo(userData);
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !identity) return;
    
    setIsLoading(true);
    try {
      const otherPrincipal = Principal.fromText(conversationId);
      const success = await sendMessage(otherPrincipal, newMessage.trim());
      
      if (success) {
        setNewMessage("");
        // Reload messages to show the new message
        await loadMessages();
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
    <div className="flex-1 h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-card-border bg-blue-300 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ">
                <AvatarImage src={conversationAvatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {conversationName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-card"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-navy text-foreground">
                {userInfo?.username || conversationName}
              </h3>
              <p className="text-sm text-white text-muted-foreground">
                {userInfo?.online ? "Active now" : "Last seen recently"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-blue-200 hover:text-foreground">
              <Phone className="h-4 text-navy w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-blue-200 hover:text-foreground">
              <Video className="h-4 text-navy w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-blue-200 hover:text-foreground">
              <Search className="h-4 text-navy w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-blue-200 hover:text-foreground">
              <MoreVertical className="h-4 text-navy w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : !conversationId ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[70%] ${message.isOwn ? "flex-row-reverse" : "flex-row"}`}>
                {!message.isOwn && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={userInfo?.profilePicture || conversationAvatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {(userInfo?.username || conversationName).split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${message.isOwn ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-message transition-all duration-200 hover:shadow-lg ${
                      message.isOwn
                        ? "bg-blue-300 text-white" // own messages: grey bubble, navy text
                        : "bg-gray-200 text-navy " // received: lighter grey, navy text
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
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
      <div className="p-4 bg-white backdrop-blur-sm">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-blue-50 border-input-border text-blue-900 min-h-[44px] resize-none rounded-xl"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || !conversationId}
            className="h-11 w-11 bg-gradient-to-br from-blue-300 to-blue-400 hover:bg-gradient-purple-glow transition-all duration-200 disabled:opacity-50 shadow-purple"
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