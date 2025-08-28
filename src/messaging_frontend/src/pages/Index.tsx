import { useState } from "react";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatArea } from "@/components/ChatArea";
import { SettingsPage } from "./Settings";
import { AddUserPage } from "./AddUser";
import { WalletPage } from "./Wallet";

interface UserData {
  email: string;
  username: string;
  status: string;
  profilePicture: File | null;
  profilePictureUrl: string;
}

interface IndexProps {
  user: UserData | null;
}

const Index = ({ user }: IndexProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsBack = () => {
    setShowSettings(false);
  };

  const handleAddUserClick = () => {
    setShowAddUser(true);
  };

  const handleAddUserBack = () => {
    setShowAddUser(false);
  };

  const handleWalletClick = () => {
    setShowWallet(true);
  };

  const handleWalletBack = () => {
    setShowWallet(false);
  };

  const handleStartConversation = (userId: string) => {
    setSelectedConversationId(userId);
    setShowAddUser(false);
  };

  // Show settings page
  if (showSettings) {
    return (
      <div className="h-screen bg-white flex">
        <ConversationSidebar 
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
          onSettingsClick={handleSettingsClick}
          onAddUserClick={handleAddUserClick}
          onWalletClick={handleWalletClick}
        />
        <div className="flex-1 overflow-y-auto">
          <SettingsPage onBack={handleSettingsBack} />
        </div>
      </div>
    );
  }

  // Show add user page
  if (showAddUser) {
    return (
      <div className="h-screen bg-white flex">
        <ConversationSidebar 
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
          onSettingsClick={handleSettingsClick}
          onAddUserClick={handleAddUserClick}
          onWalletClick={handleWalletClick}
        />
        <div className="flex-1 overflow-y-auto">
          <AddUserPage 
            onBack={handleAddUserBack} 
            onStartConversation={handleStartConversation}
          />
        </div>
      </div>
    );
  }

  // Show wallet page
  if (showWallet) {
    return (
      <div className="h-screen bg-white flex">
        <ConversationSidebar 
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
          onSettingsClick={handleSettingsClick}
          onAddUserClick={handleAddUserClick}
          onWalletClick={handleWalletClick}
        />
        <div className="flex-1 overflow-y-auto">
          <WalletPage onBack={handleWalletBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <ConversationSidebar 
        selectedConversationId={selectedConversationId}
        onConversationSelect={setSelectedConversationId}
        onSettingsClick={handleSettingsClick}
        onAddUserClick={handleAddUserClick}
        onWalletClick={handleWalletClick}
      />
      <ChatArea 
        conversationId={selectedConversationId || undefined}
        conversationName="Select a conversation"
        conversationAvatar="/placeholder.svg"
        isOnline={true}
      />
    </div>
  );
};

export default Index;
