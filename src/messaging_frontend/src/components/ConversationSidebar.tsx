import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  avatar?: string;
  isOnline?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Alex Johnson",
    lastMessage: "Hey! How's the project going?",
    timestamp: "2m",
    unreadCount: 2,
    avatar: "/placeholder.svg",
    isOnline: true,
  },
  {
    id: "2",
    name: "Sarah Chen",
    lastMessage: "Thanks for the help yesterday 👍",
    timestamp: "1h",
    avatar: "/placeholder.svg",
    isOnline: true,
  },
  {
    id: "3",
    name: "Dev Team",
    lastMessage: "Mike: Ready for the standup?",
    timestamp: "3h",
    unreadCount: 2,
    avatar: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Emma Wilson",
    lastMessage: "Let's catch up this weekend!",
    timestamp: "1d",
    avatar: "/placeholder.svg",
    isOnline: false,
  },
  {
    id: "5",
    name: "Project Alpha",
    lastMessage: "Lisa: Updated the design files",
    timestamp: "2d",
    avatar: "/placeholder.svg",
  },
];

interface ConversationSidebarProps {
  selectedConversationId?: string;
  onConversationSelect: (id: string) => void;
}

export function ConversationSidebar({ selectedConversationId, onConversationSelect }: ConversationSidebarProps) {
  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blue-900">Messages</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-900 hover:text-blue-700">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-900 hover:text-blue-700">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-900" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 bg-blue-50 border-gray-300 focus:border-blue-500 text-blue-900"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 h-6 overflow-y-auto">
        {mockConversations.map((conversation) => (
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
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-900">
                    {conversation.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {conversation.isOnline && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
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
        ))}
      </div>
    </div>
  );
}