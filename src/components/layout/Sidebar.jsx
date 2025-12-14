// src/components/layout/Sidebar.jsx
import {
  AlertCircle,
  Bell,
  BookOpen,
  BookOpenText,
  Calendar,
  Home,
  LogOut,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/resources", icon: BookOpen, label: "Resources" },
    { path: "/announcements", icon: Bell, label: "Announcements" },
    { path: "/events", icon: Calendar, label: "Events" },
    { path: "/lost-found", icon: AlertCircle, label: "Lost & Found" },
    { path: "/clubs", icon: Users, label: "Clubs" },
  ];

  // Add admin panel for moderators and admins
  if (user && (user.role === "admin" || user.role === "moderator")) {
    navItems.push({ path: "/admin", icon: Settings, label: "Admin Panel" });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Logo and Close Button */}
            <div className="flex items-center justify-between mb-8">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="bg-opacity-20 p-2 rounded-lg">
                  <BookOpenText size={24} />
                </div>
                <span className="text-xl font-bold">CRH</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden hover:bg-white hover:bg-opacity-10 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? "bg-blue-700 shadow-lg"
                      : "hover:bg-blue-700 hover:bg-opacity-50"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* User Section */}
        <div className="p-6 border-t border-blue-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-blue-300 hover:text-white transition w-full px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
