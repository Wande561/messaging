import { useState, useEffect } from 'react';
import { useAuth } from './AppContext';

export interface ConversationUser {
  principal: string;
  username: string;
  profilePicture: string;
  status: string;
  online: boolean;
}

export interface Message {
  sender: any;
  receiver: any;
  text: string;
  timestamp: bigint;
}

export interface Conversation {
  user: ConversationUser;
  messages: Message[];
  lastMessage?: Message;
  unreadCount?: number;
}

export const useConversations = () => {
  const { getUserConversations, getUser, isAuthenticated, identity } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load conversations when user is authenticated
  useEffect(() => {
    if (isAuthenticated && identity) {
      loadConversations();
      
      // Restore selected conversation from localStorage
      const savedConversationId = localStorage.getItem('selectedConversationId');
      if (savedConversationId) {
        setSelectedConversationId(savedConversationId);
      }
    } else {
      // Clear conversations when not authenticated
      setConversations([]);
      setSelectedConversationId(null);
      localStorage.removeItem('selectedConversationId');
    }
  }, [isAuthenticated, identity]);

  const loadConversations = async () => {
    if (!isAuthenticated || !identity) return;
    
    setLoading(true);
    try {
      console.log("Loading conversations...");
      const conversationsData = await getUserConversations();
      
      if (!conversationsData || conversationsData.length === 0) {
        console.log("No conversations found");
        setConversations([]);
        return;
      }

      // Transform the data and get user details
      const transformedConversations: Conversation[] = [];
      
      for (const [otherPrincipal, messages] of conversationsData) {
        try {
          const userData = await getUser(otherPrincipal);
          if (userData) {
            const conversation: Conversation = {
              user: {
                principal: otherPrincipal.toString(),
                username: userData.username,
                profilePicture: userData.profilePicture || "",
                status: userData.status || "Available",
                online: userData.online || false,
              },
              messages: messages,
              lastMessage: messages.length > 0 ? messages[messages.length - 1] : undefined,
            };
            transformedConversations.push(conversation);
          }
        } catch (error) {
          console.error(`Failed to load user data for ${otherPrincipal}:`, error);
        }
      }

      // Sort by last message timestamp (newest first)
      transformedConversations.sort((a, b) => {
        const aTime = a.lastMessage ? Number(a.lastMessage.timestamp) : 0;
        const bTime = b.lastMessage ? Number(b.lastMessage.timestamp) : 0;
        return bTime - aTime;
      });

      console.log("Conversations loaded:", transformedConversations);
      setConversations(transformedConversations);
      
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (principalId: string) => {
    setSelectedConversationId(principalId);
    localStorage.setItem('selectedConversationId', principalId);
  };

  const clearSelectedConversation = () => {
    setSelectedConversationId(null);
    localStorage.removeItem('selectedConversationId');
  };

  const getSelectedConversation = (): Conversation | null => {
    if (!selectedConversationId) return null;
    return conversations.find(conv => conv.user.principal === selectedConversationId) || null;
  };

  const refreshConversations = async () => {
    await loadConversations();
  };

  const addNewConversation = async (otherPrincipal: any) => {
    try {
      const userData = await getUser(otherPrincipal);
      if (userData) {
        const newConversation: Conversation = {
          user: {
            principal: otherPrincipal.toString(),
            username: userData.username,
            profilePicture: userData.profilePicture || "",
            status: userData.status || "Available",
            online: userData.online || false,
          },
          messages: [],
        };

        const existingIndex = conversations.findIndex(
          conv => conv.user.principal === otherPrincipal.toString()
        );

        if (existingIndex >= 0) {
          setConversations(prev => {
            const updated = [...prev];
            updated[existingIndex] = newConversation;
            return updated;
          });
        } else {
          setConversations(prev => [newConversation, ...prev]);
        }
        
        selectConversation(otherPrincipal.toString());
        return newConversation;
      }
    } catch (error) {
      console.error("Failed to add new conversation:", error);
    }
    return null;
  };

  return {
    conversations,
    selectedConversationId,
    selectedConversation: getSelectedConversation(),
    loading,
    selectConversation,
    clearSelectedConversation,
    refreshConversations,
    addNewConversation,
  };
};