import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MoreVertical, Phone, Video, Search } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hey! How's the project going?",
    timestamp: "10:30 AM",
    isOwn: false,
    senderName: "Alex Johnson",
    senderAvatar: "/placeholder.svg",
  },
  {
    id: "2",
    content: "It's going really well! Just finished the design system implementation. The purple theme looks amazing 🎨",
    timestamp: "10:32 AM",
    isOwn: true,
  },
  {
    id: "3",
    content: "That's awesome! Can't wait to see it. Are you using any specific design patterns?",
    timestamp: "10:33 AM",
    isOwn: false,
    senderName: "Alex Johnson",
    senderAvatar: "/placeholder.svg",
  },
  {
    id: "4",
    content: "Yes! I'm following modern chat app patterns with a focus on gradients and smooth animations. The color palette is really cohesive.",
    timestamp: "10:35 AM",
    isOwn: true,
  },
  {
    id: "5",
    content: "Sounds perfect! I love how modern messaging apps have evolved with better UX patterns.",
    timestamp: "10:36 AM",
    isOwn: false,
    senderName: "Alex Johnson",
    senderAvatar: "/placeholder.svg",
  },
];

interface ChatAreaProps {
  conversationName?: string;
  conversationAvatar?: string;
  isOnline?: boolean;
}

export function ChatArea({ 
  conversationName = "Alex Johnson",
  conversationAvatar = "/placeholder.svg",
  isOnline = true 
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setNewMessage("");
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
              <h3 className="font-semibold text-navy text-foreground">{conversationName}</h3>
              <p className="text-sm text-white text-muted-foreground">
                {isOnline ? "Active now" : "Last seen 2h ago"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Phone className="h-4 text-navy w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Video className="h-4 text-navy w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Search className="h-4 text-navy w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 text-navy w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[70%] ${message.isOwn ? "flex-row-reverse" : "flex-row"}`}>
              {!message.isOwn && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={message.senderAvatar} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {message.senderName?.split(' ').map(n => n[0]).join('')}
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
        ))}
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
            disabled={!newMessage.trim()}
            className="h-11 w-11 bg-gradient-to-br from-blue-300 to-blue-400 hover:bg-gradient-purple-glow transition-all duration-200 disabled:opacity-50 shadow-purple"
          >
            <Send className="h-4 w-4 text-blue-900" />
          </Button>
        </div>
      </div>
    </div>
  );
}