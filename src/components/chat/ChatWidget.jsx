import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  User,
  X,
  Circle,
  Users,
  Settings,
  Plus,
  ArrowLeft,
  MoreVertical,
  Trash2,
  LogOut,
  UserPlus,
  FileText,
  Loader2,
  AlertTriangle,
  Paperclip,
  Download,
  Image as ImageIcon,
  File,
  ShieldCheck,
  Lock,
  Upload,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { chatService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const getConversationName = (conversation, currentUser) => {
  if (conversation.type === "group") return conversation.name;
  const other = conversation.members?.find(
    (member) => member._id !== currentUser?.id && member._id !== currentUser?._id
  );
  return other?.name || "Direct Message";
};

const getConversationImage = (conversation, currentUser) => {
  if (conversation.type === "group") return conversation.image;
  const other = conversation.members?.find(
    (member) => member._id !== currentUser?.id && member._id !== currentUser?._id
  );
  return other?.profileImage;
};

const ChatWidget = () => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const [open, setOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [view, setView] = useState("list"); // 'list', 'chat', 'create-group', 'group-info', 'verify'
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: { userId: userName } }
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // File Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(c => 
      getConversationName(c, user).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm, user]);

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
    if (open) {
      if (!isVerified) {
        setView("verify");
      } else {
        refreshConversations();
        fetchUsers();
      }
    }
  }, [open, isVerified, refreshConversations, fetchUsers]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await chatService.verifyAccess();
      if (response.data.success) {
        setIsVerified(true);
        setVerifying(false);
        setView("list");
        refreshConversations();
        fetchUsers();
        toast.success("Identity verified. Welcome to Chat!");
      } else {
        toast.error(response.data.message || "Verification failed");
        setVerifying(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error.response?.data?.message || "Verification failed. Please try again.");
      setVerifying(false);
    }
  };

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
        if (isTyping) {
          next[conversationId][userId] = userName;
        } else {
          delete next[conversationId][userId];
        }
        return next;
      });
    };

    const handleConversationUpdated = () => {
      refreshConversations();
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:typing_update", handleTypingUpdate);
    socket.on("conversation:updated", handleConversationUpdated);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:typing_update", handleTypingUpdate);
      socket.off("conversation:updated", handleConversationUpdated);
    };
  }, [socket, activeConversation?._id, refreshConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation || !socket) return;

    const text = messageText;
    setMessageText("");
    
    socket.emit("message:send", {
      conversationId: activeConversation._id,
      text: text,
    }, (response) => {
      if (!response.success) {
        toast.error(response.message || "Failed to send message");
      }
    });
  };

  const handleFileUpload = async (file, isRetry = false) => {
    if (!file || !activeConversation || !socket) return;

    console.log("Starting file upload:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // File type validation
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/svg+xml",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      toast.error("Invalid file type. Allowed types: PDF, DOC, DOCX, PPT, PPTX, XLSX, Images (JPG, PNG, WEBP, GIF, AVIF, SVG), Text, and ZIP files.");
      return;
    }

    // File size validation based on type
    const sizeLimits = {
      "image/jpeg": 10 * 1024 * 1024,
      "image/jpg": 10 * 1024 * 1024,
      "image/png": 10 * 1024 * 1024,
      "image/webp": 10 * 1024 * 1024,
      "image/gif": 10 * 1024 * 1024,
      "image/avif": 10 * 1024 * 1024,
      "image/svg+xml": 5 * 1024 * 1024,
      "application/pdf": 25 * 1024 * 1024,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25 * 1024 * 1024,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": 25 * 1024 * 1024,
      "application/vnd.ms-powerpoint": 25 * 1024 * 1024,
      "application/msword": 25 * 1024 * 1024,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 25 * 1024 * 1024,
      "text/plain": 5 * 1024 * 1024,
      "application/zip": 50 * 1024 * 1024,
      "application/x-zip-compressed": 50 * 1024 * 1024,
    };

    const maxSize = sizeLimits[file.type] || 25 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("File size exceeds limit:", file.size, maxSize);
      toast.error(`File is too large. Max size for this file type is ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setPendingFile(file);

      console.log("Sending upload request...");

      const response = await chatService.uploadAttachment(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log("Upload progress:", progress);
        setUploadProgress(progress);
      });

      console.log("Upload response:", response.data);

      const attachment = response.data.attachment;

      socket.emit("message:send", {
        conversationId: activeConversation._id,
        text: "", // Empty text for file-only message
        attachments: [attachment],
      }, (socketRes) => {
        console.log("Socket response:", socketRes);
        if (!socketRes.success) {
          toast.error("Failed to send file message");
          setUploadError("Failed to send file message");
        }
      });

      // Reset state on success
      setPendingFile(null);
      setRetryCount(0);
      toast.success("File uploaded successfully");

    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error.response?.data?.message || "Failed to upload file";
      setUploadError(errorMessage);
      toast.error(errorMessage);
      
      // Auto-retry logic for network errors
      if (retryCount < 3 && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleFileUpload(file, true);
        }, 2000 * retryCount);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!socket || !activeConversation) return;

    socket.emit("message:typing", {
      conversationId: activeConversation._id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("message:typing", {
        conversationId: activeConversation._id,
        isTyping: false,
      });
    }, 2000);
  };

  const openChat = async (conversation) => {
    setActiveConversation(conversation);
    setView("chat");
    setLoading(true);
    try {
      const response = await chatService.getMessages(conversation._id);
      setMessages(response.data.messages);
      socket?.emit("message:seen", { conversationId: conversation._id });
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const startDirectChat = async (targetUser) => {
    try {
      const response = await chatService.createDirect(targetUser._id);
      const conversation = response.data.conversation;
      setConversations(prev => {
        if (prev.find(c => c._id === conversation._id)) return prev;
        return [conversation, ...prev];
      });
      openChat(conversation);
    } catch (error) {
      toast.error("Failed to start chat");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.error("Group name and at least one member are required");
      return;
    }
    try {
      setLoading(true);
      const response = await chatService.createGroup({
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers,
      });
      const conversation = response.data.conversation;
      setConversations(prev => [conversation, ...prev]);
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers([]);
      openChat(conversation);
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConversation) return;
    try {
      await chatService.leaveGroup(activeConversation._id);
      toast.success("Left group successfully");
      setView("list");
      refreshConversations();
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  const renderListView = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((c) => (
            <button
              key={c._id}
              onClick={() => openChat(c)}
              className="w-full p-3 flex items-center space-x-3 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-color)] last:border-0"
            >
              <div className="relative">
                {getConversationImage(c, user) ? (
                  <img
                    src={getConversationImage(c, user)}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    {c.type === "group" ? <Users size={24} /> : <User size={24} />}
                  </div>
                )}
                {c.type === "direct" && isUserOnline(c.members.find(m => m._id !== user.id)?._id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-semibold text-sm truncate">{getConversationName(c, user)}</h4>
                  {c.lastMessage && (
                    <span className="text-[10px] text-gray-500">
                      {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {typingUsers[c._id] && Object.keys(typingUsers[c._id]).length > 0 
                    ? "Typing..." 
                    : c.lastMessage?.text || "No messages yet"}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 p-8 text-center">
            <MessageCircle size={48} className="opacity-20" />
            <p className="text-sm">No conversations yet.</p>
            <p className="text-xs">Start a chat from the users list.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border-color)]">
        <button 
          onClick={() => setView("users")}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>
    </div>
  );

  const renderUsersView = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center space-x-2">
        <button onClick={() => setView("list")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-semibold">New Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <button 
            onClick={() => setView("create-group")}
            className="w-full p-3 flex items-center space-x-3 hover:bg-[var(--bg-hover)] rounded-lg text-blue-600"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="font-medium text-sm">Create New Group</span>
          </button>
        </div>
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Suggested Users</div>
        {users.map((u) => (
          <button
            key={u._id}
            onClick={() => startDirectChat(u)}
            className="w-full p-3 flex items-center space-x-3 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="relative">
              {u.profileImage ? (
                <img src={u.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
              )}
              {isUserOnline(u._id) && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-gray-500">{u.role} • {u.department}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderVerifyView = () => (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-md">
        <ShieldCheck size={40} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Secure Chat Access</h2>
      <p className="text-blue-100 text-sm mb-8">
        For your security, please verify your identity to access private and group conversations.
      </p>
      <div className="w-full space-y-4">
        <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-left flex items-start space-x-3">
          <Lock size={18} className="mt-1 text-blue-200" />
          <div>
            <p className="text-xs font-bold text-blue-200 uppercase">Authenticated As</p>
            <p className="text-sm font-medium">{user?.name}</p>
          </div>
        </div>
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="w-full py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70"
        >
          {verifying ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={20} />
              <span>Verify & Enter Chat</span>
            </>
          )}
        </button>
      </div>
      <p className="mt-8 text-[10px] text-blue-300 uppercase tracking-widest font-bold">
        End-to-End Encrypted Session
      </p>
    </div>
  );

  const renderAttachment = (attachment, messageId, index) => {
    const isImage = attachment.fileType === "IMAGE";
    
    const getFileIcon = (fileType) => {
      switch (fileType) {
        case "PDF":
          return <FileText size={20} />;
        case "DOCX":
        case "DOC":
          return <FileText size={20} />;
        case "PPTX":
        case "PPT":
          return <FileText size={20} />;
        case "XLSX":
          return <FileText size={20} />;
        case "TEXT":
          return <FileText size={20} />;
        case "ZIP":
          return <File size={20} />;
        default:
          return <File size={20} />;
      }
    };

    const getFileColor = (fileType) => {
      switch (fileType) {
        case "PDF":
          return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
        case "DOCX":
        case "DOC":
          return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
        case "PPTX":
        case "PPT":
          return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400";
        case "XLSX":
          return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
        case "TEXT":
          return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
        case "ZIP":
          return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
        default:
          return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
      }
    };

    const handleDownload = async (e) => {
      e.stopPropagation();
      try {
        const response = await chatService.downloadAttachment(messageId, index);
        if (response.data.success) {
          window.open(response.data.fileUrl, '_blank');
        }
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download file");
      }
    };
    
    if (isImage) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 max-w-sm group relative">
          <img 
            src={attachment.thumbnailUrl || attachment.fileUrl} 
            alt={attachment.fileName} 
            className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={handleDownload}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleDownload}
              className="p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
              title="Download"
            >
              <Download size={14} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {attachment.fileName}
          </div>
        </div>
      );
    }

    return (
      <div 
        className="mt-2 p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
        onClick={handleDownload}
      >
        <div className={`p-2 ${getFileColor(attachment.fileType)} rounded-lg`}>
          {getFileIcon(attachment.fileType)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-[var(--text-main)]">{attachment.fileName}</p>
          <p className="text-[10px] text-[var(--text-muted)] uppercase">
            {attachment.fileType} • {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Download size={16} className="text-gray-400" />
        </div>
      </div>
    );
  };
  const renderChatView = () => (
    <div 
      className="flex flex-col h-full bg-[var(--bg-card)] relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-blue-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-200">
          <div className="w-24 h-24 border-4 border-dashed border-white/50 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <Upload size={48} />
          </div>
          <h3 className="text-2xl font-bold mb-2">Drop to Upload</h3>
          <p className="text-blue-100">Share files instantly with your colleagues</p>
        </div>
      )}

      {/* Header */}
      <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)] shadow-sm">
        <div className="flex items-center space-x-3">
          <button onClick={() => setView("list")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
            <ArrowLeft size={20} />
          </button>
          <button 
            onClick={() => activeConversation.type === "group" && setView("group-info")}
            className="flex items-center space-x-3 text-left focus:outline-none"
          >
            <div className="relative">
              {getConversationImage(activeConversation, user) ? (
                <img src={getConversationImage(activeConversation, user)} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {activeConversation.type === "group" ? <Users size={20} /> : <User size={20} />}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold truncate max-w-[150px]">{getConversationName(activeConversation, user)}</h4>
              <p className="text-[10px] text-green-500 font-medium">
                {activeConversation.type === "direct" && isUserOnline(activeConversation.members.find(m => m._id !== user.id)?._id) ? "Online" : 
                 activeConversation.type === "group" ? `${activeConversation.members.length} members` : "Offline"}
              </p>
            </div>
          </button>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-gray-500"><Settings size={18} /></button>
          <button onClick={() => setOpen(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-gray-500"><X size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : messages.length > 0 ? (
          messages.map((m, i) => {
            const isMe = m.sender._id === user.id || m.sender._id === user._id;
            const showSender = activeConversation.type === "group" && !isMe && (i === 0 || messages[i-1].sender._id !== m.sender._id);
            
            return (
              <div key={m._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {showSender && <span className="text-[10px] text-gray-500 ml-11 mb-1">{m.sender.name}</span>}
                <div className={`flex items-end space-x-2 max-w-[85%] ${isMe ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {m.sender.profileImage ? (
                        <img src={m.sender.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500"><User size={14} /></div>
                      )}
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                    isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-[var(--border-color)]"
                  }`}>
                    {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    {m.attachments?.map((attachment, idx) => (
                      <div key={idx}>{renderAttachment(attachment, m._id, idx)}</div>
                    ))}
                    <div className={`text-[9px] mt-1 flex items-center justify-end ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 py-8 text-center opacity-50">
            <MessageCircle size={40} />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing & Progress */}
      <div className="px-4 py-1">
        {isUploading && (
          <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <div className="flex justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase">
              <span className="flex items-center"><Upload size={10} className="mr-1" /> Uploading File...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}
        {uploadError && pendingFile && (
          <div className="mb-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center text-[10px] font-bold text-red-600 dark:text-red-400 mb-1 uppercase">
                  <AlertTriangle size={10} className="mr-1" /> Upload Failed
                </div>
                <p className="text-[10px] text-red-600 dark:text-red-400 truncate">{uploadError}</p>
              </div>
              <button
                onClick={() => handleFileUpload(pendingFile, true)}
                className="ml-2 px-2 py-1 bg-red-600 text-white text-[10px] rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {typingUsers[activeConversation._id] && Object.keys(typingUsers[activeConversation._id]).length > 0 && (
          <div className="text-[10px] text-gray-500 italic animate-pulse">
            {Object.values(typingUsers[activeConversation._id]).join(", ")} is typing...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
        <div className="flex items-center space-x-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 py-2 px-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isUploading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );

  const renderCreateGroupView = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center space-x-2">
        <button onClick={() => setView("users")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-semibold">Create Group</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Group Name</label>
          <input 
            type="text" 
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm"
            placeholder="Enter group name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Description (Optional)</label>
          <textarea 
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm h-20 resize-none"
            placeholder="What's this group about?"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Select Members</label>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {users.map(u => (
              <label key={u._id} className="flex items-center p-2 hover:bg-[var(--bg-hover)] rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedMembers.includes(u._id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedMembers([...selectedMembers, u._id]);
                    else setSelectedMembers(selectedMembers.filter(id => id !== u._id));
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-3 text-sm">{u.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-[var(--border-color)]">
        <button 
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );

  const renderGroupInfoView = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center space-x-2">
        <button onClick={() => setView("chat")} className="p-1 hover:bg-[var(--bg-hover)] rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-semibold">Group Info</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 flex flex-col items-center text-center space-y-3 border-b border-[var(--border-color)]">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
            {activeConversation.image ? (
              <img src={activeConversation.image} alt="" className="w-full h-full rounded-full object-cover" />
            ) : <Users size={48} />}
          </div>
          <div>
            <h2 className="text-xl font-bold">{activeConversation.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{activeConversation.description || "No description provided"}</p>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase">{activeConversation.members.length} Members</h4>
            <button className="text-blue-600 text-xs font-bold hover:underline">Add Member</button>
          </div>
          <div className="space-y-3">
            {activeConversation.members.map(m => (
              <div key={m._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {m.profileImage ? <img src={m.profileImage} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name} {m._id === user.id && "(You)"}</p>
                    {activeConversation.admins.some(a => (a._id || a) === m._id) && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">Admin</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 mt-4 space-y-2">
          <button 
            onClick={handleLeaveGroup}
            className="w-full py-2 flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Leave Group</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div 
        className={`bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] w-[380px] h-[550px] mb-4 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${
          open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
      >
        {view === "list" && renderListView()}
        {view === "chat" && renderChatView()}
        {view === "users" && renderUsersView()}
        {view === "create-group" && renderCreateGroupView()}
        {view === "group-info" && renderGroupInfoView()}
        {view === "verify" && renderVerifyView()}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 ${
          open ? "bg-red-500 rotate-90" : "bg-blue-600 hover:bg-blue-700"
        } text-white group`}
      >
        {open ? <X size={28} /> : (
          <div className="relative">
            <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
