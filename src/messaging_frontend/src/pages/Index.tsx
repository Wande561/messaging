import { useState, useEffect } from "react";
import { ConversationSidebar } from "../components/ConversationSidebar";
import { ChatArea } from "../components/ChatArea";
import { useAuth } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string>("1");
  const { isAuthenticated, backendActor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  if (isAuthenticated === null) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-blue-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      <ConversationSidebar 
        selectedConversationId={selectedConversationId}
        onConversationSelect={setSelectedConversationId}
      />
      <ChatArea 
        conversationName="Alex Johnson"
        conversationAvatar="/placeholder.svg"
        isOnline={true}
      />
    </div>
  );
};

export default Index;
