import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  MessageCircle,
  Send,
  User,
  X,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { chatService, SOCKET_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const getConversationName = (conversation, currentUser) => {
  if (!conversation) return "Chat";

  const other = conversation.members?.find(
    (member) => member._id !== currentUser?.id && member._id !== currentUser?._id
  );
  return other?.name || "Direct Message";
};

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeConversations = useMemo(
    () => conversations.filter((conversation) => conversation.type === "direct"),
    [conversations]
  );

  const fetchUsers = useCallback(async () => {
    try {
      const response = await chatService.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error("Chat users fetch error:", error);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Conversation fetch error:", error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("presence:update", setOnlineUsers);
    socket.on("message:new", (message) => {
      setMessages((current) => {
        if (message.conversation !== activeConversation?._id) return current;
        if (current.some((item) => item._id === message._id)) return current;
        return [...current, message];
      });
      refreshConversations();
    });
    socket.on("conversation:updated", refreshConversations);

    return () => {
      socket.disconnect();
    };
  }, [user, activeConversation?._id, refreshConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => {
    setOpen((value) => {
      const nextOpen = !value;
      if (nextOpen) {
        refreshConversations();
        fetchUsers();
      }
      return nextOpen;
    });
  };

  const openConversation = async (conversation) => {
    try {
      setActiveConversation(conversation);
      socketRef.current?.emit("conversation:join", conversation._id);
      const response = await chatService.getMessages(conversation._id);
      setMessages(response.data.messages);
      socketRef.current?.emit("message:seen", { conversationId: conversation._id });
    } catch (error) {
      console.error("Messages fetch error:", error);
      toast.error("Failed to open chat");
    }
  };

  const startDirectChat = async (targetUserId) => {
    try {
      const response = await chatService.createDirect(targetUserId);
      await refreshConversations();
      openConversation(response.data.conversation);
    } catch (error) {
      console.error("Start direct chat error:", error);
      toast.error("Failed to start chat");
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    socketRef.current?.emit(
      "message:send",
      { conversationId: activeConversation._id, text: messageText },
      (response) => {
        if (!response?.success) {
          toast.error(response?.message || "Failed to send message");
        }
      }
    );
    setMessageText("");
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-700 transition flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]"
        title="Open chat"
      >
        {open ? <X size={28} /> : <MessageCircle size={30} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-40 w-[calc(100vw-2rem)] max-w-5xl h-[72vh] bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden grid md:grid-cols-[320px_1fr] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <aside className="border-r border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col min-h-0">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[var(--text-main)]">Campus Chat</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {onlineUsers.length} online
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {activeConversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() => openConversation(conversation)}
                  className={`w-full p-4 text-left border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition ${
                    activeConversation?._id === conversation._id ? "bg-[var(--bg-hover)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                      {conversation.members?.find(
                        (member) => member._id !== user?.id && member._id !== user?._id
                      )?.profileImage ? (
                        <img
                          src={
                            conversation.members.find(
                              (member) =>
                                member._id !== user?.id && member._id !== user?._id
                            ).profileImage
                          }
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">
                        {getConversationName(conversation, user)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {conversation.lastMessage?.text || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              <div className="p-3">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
                  Start a private chat
                </p>
                {users.slice(0, 12).map((chatUser) => (
                  <button
                    key={chatUser._id}
                    onClick={() => startDirectChat(chatUser._id)}
                    className="w-full p-2 rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2 text-left"
                  >
                    <div className="relative h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 overflow-hidden flex items-center justify-center text-xs font-bold">
                      {chatUser.profileImage ? (
                        <img
                          src={chatUser.profileImage}
                          alt={chatUser.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        chatUser.name?.charAt(0)
                      )}
                      <Circle
                        size={10}
                        className={`absolute bottom-0 right-0 ${
                          onlineUsers.includes(chatUser._id)
                            ? "text-green-500 fill-green-500"
                            : "text-gray-300 fill-gray-300"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-main)] truncate">
                      {chatUser.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex flex-col min-h-0 bg-[var(--bg-card)]">
            {activeConversation ? (
              <>
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                  <h3 className="font-bold text-[var(--text-main)]">
                    {getConversationName(activeConversation, user)}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Private conversation
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-4 space-y-3">
                  {messages.map((message) => {
                    const mine =
                      message.sender?._id === user?.id ||
                      message.sender?._id === user?._id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2 shadow-sm ${
                            mine
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-bl-sm"
                          }`}
                        >
                          {!mine && (
                            <p className="text-xs font-semibold mb-1 opacity-80">
                              {message.sender?.name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          <p
                            className={`text-[11px] mt-1 ${
                              mine ? "text-blue-100" : "text-[var(--text-muted)]"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {mine && message.seenBy?.length > 1
                              ? " · seen"
                              : mine && message.deliveredTo?.length
                                ? " · delivered"
                                : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex gap-2">
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 px-4 py-3"
                  />
                  <button className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md">
                    <Send size={20} />
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[var(--bg-main)]">
                <MessageCircle size={56} className="text-blue-500 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-[var(--text-main)]">
                  Select a conversation
                </h3>
                <p className="text-[var(--text-muted)] mt-2">
                  Start a one-to-one conversation with another campus user.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
