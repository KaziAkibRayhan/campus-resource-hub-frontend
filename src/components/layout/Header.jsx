// src/components/layout/Header.jsx
import React, { useEffect, useState } from "react";
import { Menu, Bell, Search } from "lucide-react";
import { notificationService } from "../../services/api";

const Header = ({ setSidebarOpen, title = "Campus Resource Hub" }) => {
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
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="flex items-center justify-between p-4">
        {/* Left: Menu Button & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden hover:bg-gray-100 p-2 rounded-lg transition"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
          <button
            onClick={handleToggle}
            className="relative hover:bg-gray-100 p-2 rounded-lg transition"
          >
            <Bell size={24} className="text-gray-600" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-semibold">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b">
                <p className="font-bold text-gray-800">Notifications</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="p-4 border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <p className="font-semibold text-gray-800 text-sm">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
