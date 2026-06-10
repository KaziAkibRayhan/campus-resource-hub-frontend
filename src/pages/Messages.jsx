// src/pages/Messages.jsx
// Full-page Messages view. Reuses ChatWidget in "page" mode so the chat logic
// stays in one place; the floating popover ChatWidget still lives in Layout.
import React from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import ChatWidget from "../components/chat/ChatWidget";

const Messages = () => {
  // ?c=<conversationId>&t=<nonce> — set when arriving from a message
  // notification, so we open that sender's conversation directly.
  const [searchParams] = useSearchParams();
  const openConversationId = searchParams.get("c");
  const openTrigger = searchParams.get("t");

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="bg-blue-600/10 p-2.5 rounded-xl">
          <MessageCircle size={24} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">Messages</h2>
          <p className="text-[var(--text-muted)] mt-1">
            Chat with fellow students and groups
          </p>
        </div>
      </div>

      <ChatWidget
        variant="page"
        openConversationId={openConversationId}
        openTrigger={openTrigger}
      />
    </div>
  );
};

export default Messages;
