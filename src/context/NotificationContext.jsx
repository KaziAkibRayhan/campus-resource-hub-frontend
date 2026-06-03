/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/api";
import { toast } from "sonner";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await notificationService.getAll();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread);
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast for certain notification types
      if (notification.type !== 'message' && notification.type !== 'group_message') {
        toast.info(notification.title, {
          description: notification.message,
        });
      }
    };

    const handleUnreadCount = (count) => {
      setUnreadCount(count);
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:unread_count", handleUnreadCount);

    // Initial count fetch via socket
    socket.emit("notification:get_unread_count");

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:unread_count", handleUnreadCount);
    };
  }, [socket, user]);

  const markAsRead = async (notificationId) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await notificationService.markRead(notificationId);
    } catch (error) {
      console.error("Mark as read error:", error);
      // Revert on error if needed
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      await notificationService.markAllRead();
    } catch (error) {
      console.error("Mark all as read error:", error);
      fetchNotifications();
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
