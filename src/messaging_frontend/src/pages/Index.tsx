import { useState, useEffect, useRef } from "react";
import { ConversationSidebar, ConversationSidebarRef } from "../components/ConversationSidebar";
import { ChatArea } from "../components/ChatArea";
import { AddUserPage } from "./AddUser";
import { useAuth } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Principal } from "@dfinity/principal";

const Index = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'addUser' | 'settings' | 'wallet'>('chat');
  const { isAuthenticated, getUser } = useAuth();
  const navigate = useNavigate();
  const conversationSidebarRef = useRef<ConversationSidebarRef>(null);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load user info when conversation is selected
  useEffect(() => {
    const loadUserInfo = async () => {
      if (selectedConversationId && getUser) {
        try {
          const userPrincipal = Principal.fromText(selectedConversationId);
          const userData = await getUser(userPrincipal);
          setSelectedUser(userData);
        } catch (error) {
          console.error("Error loading user info:", error);
          setSelectedUser(null);
        }
      } else {
        setSelectedUser(null);
      }
    };

    loadUserInfo();
  }, [selectedConversationId, getUser]);

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
    setCurrentView('chat');
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

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <ConversationSidebar 
        ref={conversationSidebarRef}
        selectedConversationId={selectedConversationId}
        onConversationSelect={setSelectedConversationId}
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
