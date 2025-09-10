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
  const [manuallySelected, setManuallySelected] = useState(false); 
  const { isAuthenticated, getUser, currentUser } = useAuth();
  const navigate = useNavigate();
  const conversationSidebarRef = useRef<ConversationSidebarRef>(null);
  
  useEffect(() => {
    if (currentUser && conversationsLoaded && !selectedConversationId && !manuallySelected) {
      const stored = localStorage.getItem('selectedConversationId');
      if (stored) {
        console.log("🔄 Restoring conversation from localStorage:", stored, "manuallySelected:", manuallySelected);
        setSelectedConversationId(stored);
      }
    } else {
      console.log("❌ Skipping localStorage restoration:", {
        currentUser: !!currentUser,
        conversationsLoaded,
        selectedConversationId,
        manuallySelected
      });
    }
  }, [currentUser, conversationsLoaded, selectedConversationId, manuallySelected]);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (selectedConversationId && getUser && currentUser) {
        console.log("🔄 loadUserInfo triggered for:", selectedConversationId, "manuallySelected:", manuallySelected);
        try {
          const userPrincipal = Principal.fromText(selectedConversationId);
          const userData = await getUser(userPrincipal);
          if (userData) {
            console.log("✅ Loaded user data for:", userData.username, "from conversation:", selectedConversationId);
            setSelectedUser(userData);
          } else {
            console.warn("⚠️ Selected user not found");
            setSelectedUser(null);
          }
        } catch (error) {
          console.error("❌ Error loading user info:", error);
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

    if (selectedConversationId && currentUser) {
      loadUserInfo();
    }
  }, [selectedConversationId, getUser, currentUser, manuallySelected]);

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
    setManuallySelected(true); 
    setSelectedConversationId(userId);
    localStorage.setItem('selectedConversationId', userId);
    console.log("🚀 Starting conversation with:", userId);
    setCurrentView('chat');

    if (conversationSidebarRef.current) {
      setTimeout(() => {
        conversationSidebarRef.current?.refreshConversations();
      }, 500); 
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    console.log("💬 Manually selecting conversation:", conversationId);
    setManuallySelected(true); 
    setSelectedConversationId(conversationId);
    localStorage.setItem('selectedConversationId', conversationId);
  };

  const handleConversationsLoaded = (conversations: any[]) => {
    console.log("📋 handleConversationsLoaded called, manuallySelected:", manuallySelected);
    setConversationsLoaded(true);
    
    if (manuallySelected) {
      console.log("🚫 Skipping conversation auto-selection due to manual selection");
      return;
    }

    const storedConversationId = localStorage.getItem('selectedConversationId');
    
    if (storedConversationId && conversations.length > 0) {
      const storedConversationExists = conversations.some(conv => conv.id === storedConversationId);
      
      if (storedConversationExists) {
        console.log("✅ Restoring stored conversation from conversations list:", storedConversationId);
        setSelectedConversationId(storedConversationId);
      } else {
        console.log("⚠️ Stored conversation not found, selecting first available");
        localStorage.removeItem('selectedConversationId');
        const firstConversationId = conversations[0].id;
        setSelectedConversationId(firstConversationId);
        localStorage.setItem('selectedConversationId', firstConversationId);
      }
    } else if (!storedConversationId && conversations.length > 0) {
      console.log("🔄 No stored conversation, selecting first available");
      const firstConversationId = conversations[0].id;
      setSelectedConversationId(firstConversationId);
      localStorage.setItem('selectedConversationId', firstConversationId);
    }
  };

  const handleMessageSent = () => {
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

  if (currentView === 'addUser') {
    return (
      <AddUserPage 
        onBack={handleBackToChat}
        onStartConversation={handleStartConversation}
      />
    );
  }

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
