import { useState } from "react";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatArea } from "@/components/ChatArea";

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
  const [selectedConversationId, setSelectedConversationId] = useState<string>("1");

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
