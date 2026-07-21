/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { SOCKET_URL } from "../services/api";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
        setIsConnected(false);
      }
      return undefined;
    }

    if (!socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        // Vercel WebSocket Functions require a direct WebSocket connection;
        // HTTP long-polling is a separate Function invocation and cannot upgrade.
        transports: ["websocket"],
        reconnection: true,
        // Vercel closes a socket at the Function's maximum duration, so keep
        // reconnecting and let Socket.IO restore personal/conversation rooms.
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected");
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("Socket disconnected");
      });

      newSocket.on("presence:update", (userIds) => {
        setOnlineUsers(userIds);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on every render, only when user logs out or component unmounts
    };
  }, [user]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    onlineUsers,
    isConnected,
    isUserOnline: (userId) => onlineUsers.includes(userId?.toString()),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
