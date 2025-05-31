import React, { useState, useEffect } from "react";
import { db, type Chat } from "../lib/db";

interface ChatSidebarProps {
  activeChatId: number | null;
  onChatSelect: (chatId: number) => void;
  onNewChat: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  activeChatId,
  onChatSelect,
  onNewChat,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);

  // Load all chats from the database
  useEffect(() => {
    const loadChats = async () => {
      const allChats = await db.getAllChats();
      setChats(allChats);
    };

    loadChats();
  }, []);

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Chats</h3>
        <button className="new-chat-button" onClick={onNewChat}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </button>
      </div>

      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="empty-state">No chats yet</div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                chat.id === activeChatId ? "active" : ""
              }`}
              onClick={() => chat.id && onChatSelect(chat.id)}
            >
              {chat.title}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
