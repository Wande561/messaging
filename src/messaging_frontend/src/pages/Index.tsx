import { useState, useEffect, useRef } from "react";
import { ConversationSidebar, ConversationSidebarRef } from "../components/ConversationSidebar";
import { ChatArea } from "../components/ChatArea";
import { AddUserPage } from "./AddUser";
import { WalletPage } from "./Wallet";
import { useAuth } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Principal } from "@dfinity/principal";

const Index = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'addUser' | 'settings' | 'wallet'>('chat');
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const { isAuthenticated, getUser, currentUser } = useAuth();
  const navigate = useNavigate();
  const conversationSidebarRef = useRef<ConversationSidebarRef>(null);

  

  useEffect(() => {
    if (currentUser && conversationsLoaded && !selectedConversationId) {
      const stored = localStorage.getItem('selectedConversationId');
      if (stored) {
        console.log("🔄 Restoring conversation after user session restored:", stored);
        setSelectedConversationId(stored);
      }
    }
  }, [currentUser, conversationsLoaded, selectedConversationId]);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (selectedConversationId && getUser && conversationsLoaded && currentUser) {
        try {
          const userPrincipal = Principal.fromText(selectedConversationId);
          const userData = await getUser(userPrincipal);
          if (userData) {
            setSelectedUser(userData);
          } else {
            console.warn("⚠️ Selected user not found");
            setSelectedUser(null);
          }
        } catch (error) {
          console.error("❌ Error loading user info:", error);
          // Invalid principal format - clear the stored conversation
          if (error instanceof Error && error.message.includes('Invalid character')) {
            console.warn("⚠️ Invalid principal format, clearing stored conversation");
            setSelectedConversationId(null);
            localStorage.removeItem('selectedConversationId');
          }
          setSelectedUser(null);
        }
      } else {
        setSelectedUser(null);
      }
    };
    
    if (selectedConversationId && conversationsLoaded && currentUser) {
      loadUserInfo();
    }
  }, [selectedConversationId, getUser, conversationsLoaded, currentUser]);

  const handleAddUserClick = () => {
    setCurrentView('addUser');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleWalletClick = () => {
    setCurrentView('wallet');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  const handleStartConversation = (userId: string) => {
    setSelectedConversationId(userId);
    // Persist to localStorage
    localStorage.setItem('selectedConversationId', userId);
    setCurrentView('chat');
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Persist to localStorage
    localStorage.setItem('selectedConversationId', conversationId);
  };

  const handleConversationsLoaded = (conversations: any[]) => {
    setConversationsLoaded(true);
    
    // Check if we have a stored conversation to restore
    const storedConversationId = localStorage.getItem('selectedConversationId');
    
    if (storedConversationId && conversations.length > 0) {
      // Check if the stored conversation exists in the loaded conversations
      const storedConversationExists = conversations.some(conv => conv.id === storedConversationId);
      
      if (storedConversationExists) {
        // Restore the stored conversation
        setSelectedConversationId(storedConversationId);
      } else {
        // Stored conversation doesn't exist anymore, clear it and select first available
        localStorage.removeItem('selectedConversationId');
        const firstConversationId = conversations[0].id;
        setSelectedConversationId(firstConversationId);
        localStorage.setItem('selectedConversationId', firstConversationId);
      }
    } else if (!storedConversationId && conversations.length > 0) {
      // No stored conversation, select the first one
      const firstConversationId = conversations[0].id;
      setSelectedConversationId(firstConversationId);
      localStorage.setItem('selectedConversationId', firstConversationId);
    }
  };

  const handleMessageSent = () => {
    // Refresh conversations when a message is sent
    if (conversationSidebarRef.current) {
      conversationSidebarRef.current.refreshConversations();
    }
  };
  
  if (isAuthenticated === null) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-blue-900">Loading...</div>
      </div>
    );
  }

  // Render AddUser page
  if (currentView === 'addUser') {
    return (
      <AddUserPage 
        onBack={handleBackToChat}
        onStartConversation={handleStartConversation}
      />
    );
  }

  // Render Wallet page
  if (currentView === 'wallet') {
    return (
      <WalletPage 
        onBack={handleBackToChat}
      />
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <ConversationSidebar 
        ref={conversationSidebarRef}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
        onConversationsLoaded={handleConversationsLoaded}
        onAddUserClick={handleAddUserClick}
        onSettingsClick={handleSettingsClick}
        onWalletClick={handleWalletClick}
      />
      <ChatArea 
        conversationId={selectedConversationId || undefined}
        conversationName={selectedUser?.username || "Select Conversation"}
        conversationAvatar={selectedUser?.profilePicture || "/placeholder.svg"}
        isOnline={selectedUser?.online || false}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
};

export default Index;
