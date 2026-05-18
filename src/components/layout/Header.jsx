// src/components/layout/Header.jsx
import React, { useEffect, useState } from "react";
import { Menu, Bell, Search, Moon, Sun } from "lucide-react";
import { notificationService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const Header = ({ setSidebarOpen, title = "Campus Resource Hub" }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationService.getAll();
        setNotifications(response.data.notifications);
        setUnread(response.data.unread);
      } catch (error) {
        console.error("Notification fetch error:", error);
      }
    };

    fetchNotifications();
  }, []);

  const handleToggle = async () => {
    setOpen((value) => !value);
    if (!open && unread > 0) {
      try {
        await notificationService.markAllRead();
        setUnread(0);
      } catch (error) {
        console.error("Notification read error:", error);
      }
    }
  };

  return (
    <header className="bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0">
      <div className="flex items-center justify-between p-4">
        {/* Left: Menu Button & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-lg transition"
          >
            <Menu size={24} className="text-gray-700 dark:text-slate-200" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
            {title}
          </h1>
        </div>

        {/* Right: Search & Notifications */}
        <div className="flex items-center space-x-4">
          {/* Search Bar - Hidden on small screens */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun size={22} className="text-amber-400" />
            ) : (
              <Moon size={22} className="text-slate-600" />
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
          <button
            onClick={handleToggle}
            className="relative hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-lg transition"
          >
            <Bell size={24} className="text-gray-600 dark:text-slate-200" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-semibold">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <p className="font-bold text-gray-800 dark:text-white">Notifications</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="p-4 border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-900"
                    >
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          </div>

          <div className="hidden sm:flex items-center gap-3 pl-2">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 overflow-hidden flex items-center justify-center font-bold">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="hidden lg:block leading-tight">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
