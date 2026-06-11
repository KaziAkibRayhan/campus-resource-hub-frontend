import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, Trash2, ExternalLink, MessageCircle, FileText, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

// Notification types that should open the full-page Messages route on click.
const MESSAGE_TYPES = ["message", "group_message"];

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll, loading } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead(notification._id);
    if (MESSAGE_TYPES.includes(notification.type)) {
      setIsOpen(false);
      const conversationId = notification.metadata?.conversationId;
      // Open the sender's conversation directly; the `t` nonce makes repeat
      // clicks on the same conversation re-trigger the open.
      navigate(
        conversationId
          ? `/messages?c=${conversationId}&t=${Date.now()}`
          : "/messages"
      );
    } else if (notification.link) {
      setIsOpen(false);
      // `t` nonce so re-clicking the same notification re-triggers the
      // highlight scroll even when the target page is already open.
      const separator = notification.link.includes("?") ? "&" : "?";
      navigate(`${notification.link}${separator}t=${Date.now()}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "message":
      case "group_message":
        return <MessageCircle size={16} className="text-blue-500" />;
      case "resource":
        return <FileText size={16} className="text-green-500" />;
      case "event":
        return <Calendar size={16} className="text-purple-500" />;
      case "system":
        return <AlertCircle size={16} className="text-orange-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative group"
      >
        <Bell size={22} className="text-[var(--text-muted)] group-hover:text-blue-500 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-red-500 border-2 border-[var(--header-bg)] text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
            <h3 className="font-bold text-[var(--text-main)]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
              >
                <Check size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors relative group ${
                    MESSAGE_TYPES.includes(notification.type) || notification.link ? "cursor-pointer" : ""
                  } ${
                    !notification.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex space-x-3">
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !notification.read ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-slate-800"
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? "font-bold" : "font-medium"} text-[var(--text-main)] truncate`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2 flex items-center space-x-1">
                        <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-[var(--text-muted)]">
                <Bell size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs mt-1">No new notifications</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-color)] text-center">
              <button
                onClick={clearAll}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
