import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle, Send, User, X, Users, Settings, Plus, ArrowLeft,
  LogOut, FileText, Loader2, AlertTriangle, Paperclip, Download,
  File, Upload, Search, Edit3, UserMinus, ShieldCheck, Shield,
  Phone, Mail, BookOpen, Check,
} from "lucide-react";
import { toast } from "sonner";
import { chatService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const getConversationName = (conversation, currentUser) => {
  if (conversation.type === "group") return conversation.name;
  const other = conversation.members?.find(
    (m) => m._id !== currentUser?.id && m._id !== currentUser?._id
  );
  return other?.name || "Direct Message";
};

const getConversationImage = (conversation, currentUser) => {
  if (conversation.type === "group") return conversation.image;
  const other = conversation.members?.find(
    (m) => m._id !== currentUser?.id && m._id !== currentUser?._id
  );
  return other?.profileImage;
};

const Avatar = ({ src, name, size = 10, online }) => {
  const avatarSize = size * 4; // Convert abstract size to pixels (e.g., 10 -> 40px)
  const iconSize = size * 2; // For the Lucide-React User icon

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm w-full h-full">
          {name?.[0]?.toUpperCase()}
          {!name && <User size={iconSize} />}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
            online ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
    </div>
  );
};

const ChatWidget = () => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();

  const [open, setOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  // views: list | chat | users | create-group | group-info | direct-info
  const [view, setView] = useState("list");

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Group create
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Group info editing
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupDesc, setEditingGroupDesc] = useState("");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberIds, setAddMemberIds] = useState([]);

  // File upload
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const myId = user?.id || user?._id;

  const isGroupAdmin = useMemo(
    () =>
      activeConversation?.admins?.some(
        (a) => (a._id || a) === myId
      ),
    [activeConversation, myId]
  );

  const otherMember = useMemo(() => {
    if (!activeConversation || activeConversation.type !== "direct") return null;
    return activeConversation.members?.find(
      (m) => m._id !== myId
    );
  }, [activeConversation, myId]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter((c) =>
      getConversationName(c, user).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm, user]);

  // ── Data fetching ──────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const res = await chatService.getUsers();
      setUsers(res.data.users);
    } catch (error) {
      console.error("Failed to load chat users:", error);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      setConversations(res.data.conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  // ── Auto-verify ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (isVerified) {
      refreshConversations();
      fetchUsers();
      return;
    }
    setVerifying(true);
    chatService
      .verifyAccess()
      .then((res) => {
        if (res.data.success) {
          setIsVerified(true);
          setVerifyError(null);
          setView("list");
          refreshConversations();
          fetchUsers();
        } else {
          setVerifyError(res.data.message || "Chat access denied");
        }
      })
      .catch((err) => {
        setVerifyError(err.response?.data?.message || "Unable to access chat");
      })
      .finally(() => setVerifying(false));
  }, [open, isVerified, refreshConversations, fetchUsers]);

  // ── Socket events ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (activeConversation?._id === message.conversation) {
        setMessages((prev) => [...prev, message]);
        socket.emit("message:seen", { conversationId: message.conversation });
      }
      refreshConversations();
    };

    const handleTypingUpdate = ({ conversationId, userId, userName, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (!next[conversationId]) next[conversationId] = {};
        if (isTyping) next[conversationId][userId] = userName;
        else delete next[conversationId][userId];
        return next;
      });
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:typing_update", handleTypingUpdate);
    socket.on("conversation:updated", refreshConversations);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:typing_update", handleTypingUpdate);
      socket.off("conversation:updated", refreshConversations);
    };
  }, [socket, activeConversation?._id, refreshConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Chat actions ───────────────────────────────────────────────
  const openChat = async (conversation) => {
    setActiveConversation(conversation);
    setView("chat");
    setLoading(true);
    try {
      const res = await chatService.getMessages(conversation._id);
      setMessages(res.data.messages);
      socket?.emit("message:seen", { conversationId: conversation._id });
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const startDirectChat = async (targetUser) => {
    try {
      const res = await chatService.createDirect(targetUser._id);
      const conversation = res.data.conversation;
      setConversations((prev) =>
        prev.find((c) => c._id === conversation._id) ? prev : [conversation, ...prev]
      );
      openChat(conversation);
    } catch {
      toast.error("Failed to start chat");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation || !socket) return;
    const text = messageText;
    setMessageText("");
    socket.emit("message:send", { conversationId: activeConversation._id, text }, (res) => {
      if (!res?.success) toast.error(res?.message || "Failed to send message");
    });
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!socket || !activeConversation) return;
    socket.emit("message:typing", { conversationId: activeConversation._id, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("message:typing", { conversationId: activeConversation._id, isTyping: false });
    }, 2000);
  };

  // ── File upload ────────────────────────────────────────────────
  const handleFileUpload = async (file) => {
    if (!file || !activeConversation || !socket) return;
    const allowedTypes = [
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
      "text/plain", "application/zip", "application/x-zip-compressed",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported");
      return;
    }
    const maxSize = file.type.startsWith("image/") ? 10 : file.type === "application/zip" ? 50 : 25;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Max file size is ${maxSize}MB`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setPendingFile(file);
      const res = await chatService.uploadAttachment(formData, (e) => {
        setUploadProgress(Math.round((e.loaded * 100) / e.total));
      });
      socket.emit("message:send", {
        conversationId: activeConversation._id,
        text: "",
        attachments: [res.data.attachment],
      }, (sr) => {
        if (!sr?.success) toast.error("Failed to send file");
      });
      setPendingFile(null);
      setRetryCount(0);
      toast.success("File sent!");
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      setUploadError(msg);
      toast.error(msg);
      if (retryCount < 2 && err.code === "ERR_NETWORK") {
        setRetryCount((p) => p + 1);
        setTimeout(() => handleFileUpload(file), 2000 * (retryCount + 1));
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // ── Group actions ──────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.error("Group name and at least one member required");
      return;
    }
    try {
      setLoading(true);
      const res = await chatService.createGroup({ name: groupName, description: groupDescription, memberIds: selectedMembers });
      setConversations((prev) => [res.data.conversation, ...prev]);
      setGroupName(""); setGroupDescription(""); setSelectedMembers([]);
      openChat(res.data.conversation);
    } catch {
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConversation) return;
    try {
      await chatService.leaveGroup(activeConversation._id);
      toast.success("Left group");
      setView("list");
      refreshConversations();
    } catch {
      toast.error("Failed to leave group");
    }
  };

  const handleUpdateGroup = async () => {
    try {
      const res = await chatService.updateGroupInfo(activeConversation._id, {
        name: editingGroupName,
        description: editingGroupDesc,
      });
      setActiveConversation(res.data.conversation);
      setIsEditingGroup(false);
      toast.success("Group updated");
      refreshConversations();
    } catch {
      toast.error("Failed to update group");
    }
  };

  const handleAddMembers = async () => {
    if (addMemberIds.length === 0) return;
    try {
      const res = await chatService.addMembers(activeConversation._id, addMemberIds);
      setActiveConversation(res.data.conversation);
      setShowAddMember(false);
      setAddMemberIds([]);
      toast.success("Members added");
    } catch {
      toast.error("Failed to add members");
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await chatService.removeMember(activeConversation._id, userId);
      setActiveConversation(res.data.conversation);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handlePromoteAdmin = async (userId) => {
    try {
      const res = await chatService.promoteAdmin(activeConversation._id, userId);
      setActiveConversation(res.data.conversation);
      toast.success("Promoted to admin");
    } catch {
      toast.error("Failed to promote");
    }
  };

  const handleDemoteAdmin = async (userId) => {
    try {
      const res = await chatService.demoteAdmin(activeConversation._id, userId);
      setActiveConversation(res.data.conversation);
      toast.success("Admin removed");
    } catch {
      toast.error("Failed to demote");
    }
  };

  // ── Drag & drop ────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); };

  // ── Attachment renderer ────────────────────────────────────────
  const renderAttachment = (attachment, messageId, index) => {
    const isImage = attachment.fileType === "IMAGE";
    const colorMap = {
      PDF: "bg-red-100 text-red-600",
      DOCX: "bg-blue-100 text-blue-600",
      DOC: "bg-blue-100 text-blue-600",
      PPTX: "bg-orange-100 text-orange-600",
      XLSX: "bg-green-100 text-green-600",
      ZIP: "bg-purple-100 text-purple-600",
    };

    const handleDl = async (e) => {
      e.stopPropagation();
      try {
        const res = await chatService.downloadAttachment(messageId, index);
        if (res.data.success) window.open(res.data.fileUrl, "_blank");
      } catch { toast.error("Download failed"); }
    };

    if (isImage) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-[220px] group relative border border-gray-200 dark:border-slate-700">
          <img
            src={attachment.thumbnailUrl || attachment.fileUrl}
            alt={attachment.fileName}
            className="w-full h-auto max-h-48 object-cover cursor-pointer"
            onClick={handleDl}
          />
          <button onClick={handleDl} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition">
            <Download size={12} />
          </button>
        </div>
      );
    }

    return (
      <div
        onClick={handleDl}
        className="mt-2 p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition group max-w-[220px]"
      >
        <div className={`p-1.5 rounded ${colorMap[attachment.fileType] || "bg-gray-100 text-gray-600"}`}>
          <FileText size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold truncate">{attachment.fileName}</p>
          <p className="text-[9px] text-gray-400 uppercase">{attachment.fileType} · {(attachment.fileSize / 1048576).toFixed(1)}MB</p>
        </div>
        <Download size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // VIEWS
  // ══════════════════════════════════════════════════════════════

  const renderListView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <h3 className="font-bold text-[var(--text-main)]">Messages</h3>
        <button onClick={() => setView("users")} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus size={16} />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[var(--border-color)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((c) => {
            const otherUser = c.type === "direct" ? c.members?.find((m) => m._id !== myId) : null;
            const online = c.type === "direct" && isUserOnline(otherUser?._id);
            const isTypingNow = typingUsers[c._id] && Object.keys(typingUsers[c._id]).length > 0;
            return (
              <button
                key={c._id}
                onClick={() => openChat(c)}
                className="w-full px-3 py-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition border-b border-[var(--border-color)] last:border-0"
              >
                <Avatar
                  src={getConversationImage(c, user)}
                  name={getConversationName(c, user)}
                  size={11}
                  online={c.type === "direct" ? online : undefined}
                />
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-sm text-[var(--text-main)] truncate">{getConversationName(c, user)}</span>
                    {c.lastMessage && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                        {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${isTypingNow ? "text-blue-500 italic" : "text-gray-400"}`}>
                    {isTypingNow ? "typing..." : c.lastMessage?.text || (c.lastMessage?.attachments?.length ? "📎 File" : "No messages yet")}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <MessageCircle size={40} className="opacity-20 mb-3" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Tap + to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsersView = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
        <button onClick={() => setView("list")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-semibold text-[var(--text-main)]">New Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <button
            onClick={() => setView("create-group")}
            className="w-full p-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] rounded-xl text-blue-600 transition"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Create New Group</p>
              <p className="text-xs text-gray-400">Start a group conversation</p>
            </div>
          </button>
        </div>
        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">People</div>
        {users.map((u) => (
          <button
            key={u._id}
            onClick={() => startDirectChat(u)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition"
          >
            <Avatar src={u.profileImage} name={u.name} size={10} online={isUserOnline(u._id)} />
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--text-main)]">{u.name}</p>
              <p className="text-xs text-gray-400 capitalize">{u.role} · {u.department}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderChatView = () => {
    const conversationTypingUsers = activeConversation ? typingUsers[activeConversation._id] : {};
    const isTyping = conversationTypingUsers && Object.keys(conversationTypingUsers).length > 0;

    return (
      <div
        className="flex flex-col h-full relative"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-20 bg-blue-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center">
            <Upload size={48} className="mb-3" />
            <p className="font-bold text-xl">Drop to share</p>
          </div>
        )}

        {/* Header */}
        <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setView("list")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() =>
                setView(activeConversation.type === "group" ? "group-info" : "direct-info")
              }
              className="flex items-center gap-2 focus:outline-none"
            >
              <Avatar
                src={getConversationImage(activeConversation, user)}
                name={getConversationName(activeConversation, user)}
                size={9}
                online={
                  activeConversation.type === "direct"
                    ? isUserOnline(otherMember?._id)
                    : undefined
                }
              />
              <div className="text-left">
                <p className="text-sm font-bold text-[var(--text-main)] max-w-[130px] truncate">
                  {getConversationName(activeConversation, user)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {activeConversation.type === "direct"
                    ? isUserOnline(otherMember?._id)
                      ? "Online"
                      : "Offline"
                    : `${activeConversation.members?.length} members`}
                </p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setView(activeConversation.type === "group" ? "group-info" : "direct-info")
              }
              className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-gray-500"
              title="Info / Settings"
            >
              <Settings size={17} />
            </button>
            <button onClick={() => setOpen(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-gray-500">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50/30 dark:bg-slate-900/30">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-40">
              <MessageCircle size={36} />
              <p className="text-sm mt-2">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.sender._id === myId;
              const prevSenderId = i > 0 ? messages[i - 1].sender._id : null;
              const showAvatar = !isMe && m.sender._id !== prevSenderId;
              const showName =
                activeConversation.type === "group" && !isMe && showAvatar;

              return (
                <div key={m._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {showName && (
                    <span className="text-[10px] text-gray-500 ml-9 mb-0.5">{m.sender.name}</span>
                  )}
                  <div className={`flex items-end gap-1.5 max-w-[82%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar — show for others always; for me only first in a sequence */}
                    {!isMe && (
                      <div className="flex-shrink-0 w-7">
                        {showAvatar && (
                          <Avatar src={m.sender.profileImage} name={m.sender.name} size={7} />
                        )}
                      </div>
                    )}
                    {isMe && (
                      <div className="flex-shrink-0 w-7">
                        {(i === messages.length - 1 || messages[i + 1]?.sender._id !== myId) && (
                          <Avatar src={user?.profileImage} name={user?.name} size={7} />
                        )}
                      </div>
                    )}

                    <div
                      className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-[var(--border-color)]"
                      }`}
                    >
                      {m.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>}
                      {m.attachments?.map((att, idx) => (
                        <div key={idx}>{renderAttachment(att, m._id, idx)}</div>
                      ))}
                      <p className={`text-[9px] mt-1 text-right ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing / Upload status */}
        <div className="px-3 min-h-[20px]">
          {isUploading && (
            <div className="mb-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-[10px] text-blue-600 flex items-center justify-between">
              <span className="flex items-center gap-1"><Upload size={10} /> Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
          )}
          {uploadError && pendingFile && (
            <div className="mb-1 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg text-[10px] text-red-600">
              <AlertTriangle size={10} />
              <span className="flex-1 truncate">{uploadError}</span>
              <button onClick={() => handleFileUpload(pendingFile)} className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px]">Retry</button>
            </div>
          )}
          {isTyping && (
            <p className="text-[10px] text-blue-500 italic animate-pulse">
              {Object.values(conversationTypingUsers).join(", ")} is typing...
            </p>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 text-gray-400 hover:text-blue-600 transition disabled:opacity-40"
            >
              <Paperclip size={19} />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1 py-2 px-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || isUploading}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-40 transition active:scale-95 shadow"
            >
              <Send size={17} />
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderCreateGroupView = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
        <button onClick={() => setView("users")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-semibold text-[var(--text-main)]">Create Group</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Group Name *</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. CSE 5th Semester"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
          <textarea
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            className="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="What's this group about?"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Select Members ({selectedMembers.length} selected)
          </label>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {users.map((u) => (
              <label
                key={u._id}
                className="flex items-center gap-3 p-2 hover:bg-[var(--bg-hover)] rounded-lg cursor-pointer transition"
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition ${
                  selectedMembers.includes(u._id)
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}>
                  {selectedMembers.includes(u._id) && <Check size={12} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedMembers.includes(u._id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedMembers([...selectedMembers, u._id]);
                    else setSelectedMembers(selectedMembers.filter((id) => id !== u._id));
                  }}
                />
                <Avatar src={u.profileImage} name={u.name} size={8} />
                <div>
                  <p className="text-sm font-medium text-[var(--text-main)]">{u.name}</p>
                  <p className="text-[10px] text-gray-400">{u.department}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-[var(--border-color)]">
        <button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition"
        >
          {loading ? "Creating..." : `Create Group (${selectedMembers.length} members)`}
        </button>
      </div>
    </div>
  );

  const renderDirectInfoView = () => {
    if (!otherMember) return null;
    const online = isUserOnline(otherMember._id);
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
          <button onClick={() => setView("chat")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-semibold text-[var(--text-main)]">Contact Info</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Profile hero */}
          <div className="flex flex-col items-center py-8 px-6 border-b border-[var(--border-color)] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10">
            <div className="mb-4">
              <Avatar src={otherMember.profileImage} name={otherMember.name} size={20} online={online} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">{otherMember.name}</h2>
            <p className="text-sm text-gray-500 mt-1 capitalize">{otherMember.role}</p>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {online ? "● Online" : "● Offline"}
            </span>
          </div>

          {/* Info rows */}
          <div className="p-4 space-y-3">
            {otherMember.email && (
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-xl">
                <Mail size={16} className="text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
                  <p className="text-sm text-[var(--text-main)]">{otherMember.email}</p>
                </div>
              </div>
            )}
            {otherMember.department && (
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-xl">
                <BookOpen size={16} className="text-purple-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Department</p>
                  <p className="text-sm text-[var(--text-main)]">{otherMember.department}</p>
                </div>
              </div>
            )}
            {otherMember.studentId && (
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-xl">
                <User size={16} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Student ID</p>
                  <p className="text-sm text-[var(--text-main)]">{otherMember.studentId}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4">
            <button
              onClick={() => setView("chat")}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGroupInfoView = () => {
    if (!activeConversation) return null;
    const nonMembers = users.filter(
      (u) => !activeConversation.members?.some((m) => m._id === u._id)
    );

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setView("chat")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h3 className="font-semibold text-[var(--text-main)]">Group Info</h3>
          </div>
          {isGroupAdmin && !isEditingGroup && (
            <button
              onClick={() => {
                setEditingGroupName(activeConversation.name);
                setEditingGroupDesc(activeConversation.description || "");
                setIsEditingGroup(true);
              }}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-blue-600"
              title="Edit group"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Group hero / edit form */}
          <div className="p-5 border-b border-[var(--border-color)] bg-gradient-to-b from-blue-50/40 to-transparent dark:from-blue-900/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 mb-3 shadow-inner">
                {activeConversation.image ? (
                  <img src={activeConversation.image} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Users size={36} />
                )}
              </div>
              {isEditingGroup ? (
                <div className="w-full space-y-2">
                  <input
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <textarea
                    value={editingGroupDesc}
                    onChange={(e) => setEditingGroupDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-xs text-center resize-none h-14 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Group description..."
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingGroup(false)} className="flex-1 py-1.5 bg-[var(--bg-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--bg-hover)] transition">Cancel</button>
                    <button onClick={handleUpdateGroup} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-[var(--text-main)]">{activeConversation.name}</h2>
                  <p className="text-xs text-gray-400 mt-1">{activeConversation.description || "No description"}</p>
                </>
              )}
            </div>
          </div>

          {/* Add Members (admin only) */}
          {isGroupAdmin && (
            <div className="p-4 border-b border-[var(--border-color)]">
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="w-full flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl text-blue-600 text-sm font-semibold transition"
              >
                <Plus size={18} />
                Add Members
              </button>

              {showAddMember && (
                <div className="mt-3 space-y-2">
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-[var(--border-color)] rounded-lg p-2">
                    {nonMembers.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">All users are already members</p>
                    ) : (
                      nonMembers.map((u) => (
                        <label key={u._id} className="flex items-center gap-3 p-2 hover:bg-[var(--bg-hover)] rounded-lg cursor-pointer">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border-2 ${
                            addMemberIds.includes(u._id) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                          }`}>
                            {addMemberIds.includes(u._id) && <Check size={10} className="text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={addMemberIds.includes(u._id)}
                            onChange={(e) => {
                              if (e.target.checked) setAddMemberIds([...addMemberIds, u._id]);
                              else setAddMemberIds(addMemberIds.filter((id) => id !== u._id));
                            }}
                          />
                          <Avatar src={u.profileImage} name={u.name} size={7} />
                          <span className="text-sm text-[var(--text-main)]">{u.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {addMemberIds.length > 0 && (
                    <button
                      onClick={handleAddMembers}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                    >
                      Add {addMemberIds.length} member{addMemberIds.length > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Members list */}
          <div className="p-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3">
              {activeConversation.members?.length} Members
            </h4>
            <div className="space-y-2">
              {activeConversation.members?.map((m) => {
                const isMe = m._id === myId;
                const memberIsAdmin = activeConversation.admins?.some(
                  (a) => (a._id || a) === m._id
                );
                return (
                  <div key={m._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={m.profileImage}
                        name={m.name}
                        size={9}
                        online={isUserOnline(m._id)}
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-main)]">
                          {m.name} {isMe && <span className="text-gray-400 text-xs">(You)</span>}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {memberIsAdmin && (
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                              <Shield size={8} /> Admin
                            </span>
                          )}
                          <span className="text-[9px] text-gray-400 capitalize">{m.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin controls — only show for other members */}
                    {isGroupAdmin && !isMe && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {memberIsAdmin ? (
                          <button
                            onClick={() => handleDemoteAdmin(m._id)}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                            title="Remove admin"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteAdmin(m._id)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Make admin"
                          >
                            <Shield size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(m._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Remove from group"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave */}
          <div className="p-4 border-t border-[var(--border-color)]">
            <button
              onClick={handleLeaveGroup}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition text-sm font-semibold"
            >
              <LogOut size={16} />
              Leave Group
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLoadingView = () => (
    <div className="flex flex-col h-full items-center justify-center">
      <Loader2 size={36} className="text-blue-500 animate-spin mb-3" />
      <p className="text-sm text-[var(--text-muted)]">Connecting...</p>
    </div>
  );

  const renderErrorView = () => (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <AlertTriangle size={36} className="text-amber-500 mb-3" />
      <h3 className="font-bold text-[var(--text-main)] mb-2">Chat Unavailable</h3>
      <p className="text-sm text-[var(--text-muted)] mb-5">{verifyError}</p>
      <button
        onClick={() => { setIsVerified(false); setVerifyError(null); }}
        className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
      >
        Try Again
      </button>
    </div>
  );

  const toggleMessages = () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    setView("list");
  };

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div
        className={`bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] w-[min(385px,calc(100vw-2rem))] h-[min(560px,calc(100vh-7rem))] mb-4 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-0 opacity-0 pointer-events-none"
        }`}
      >
        {verifying && renderLoadingView()}
        {!verifying && verifyError && renderErrorView()}
        {!verifying && !verifyError && view === "list" && renderListView()}
        {!verifying && !verifyError && view === "chat" && activeConversation && renderChatView()}
        {!verifying && !verifyError && view === "users" && renderUsersView()}
        {!verifying && !verifyError && view === "create-group" && renderCreateGroupView()}
        {!verifying && !verifyError && view === "group-info" && activeConversation && renderGroupInfoView()}
        {!verifying && !verifyError && view === "direct-info" && activeConversation && renderDirectInfoView()}
      </div>

      {/* Messages entry point */}
      <div className="flex flex-col items-end gap-3">
        <button
          onClick={toggleMessages}
          className="group flex items-center gap-2 transition-all duration-300 active:scale-95 pointer-events-auto"
        >
          <span className="px-3 py-1.5 rounded-full text-xs font-bold shadow-lg bg-white dark:bg-slate-900 text-blue-600 border border-blue-100 dark:border-blue-900/50">
            Messages
          </span>
          <span className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-white transition-all duration-300 ${
            open ? "bg-gray-700 rotate-90" : "bg-blue-600 hover:bg-blue-700"
          }`}>
            {open ? <X size={25} /> : (
              <div className="relative">
                <MessageCircle size={25} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
              </div>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
