// src/components/layout/Sidebar.jsx
import {
  AlertCircle,
  Bell,
  BookOpen,
  BookOpenText,
  Calendar,
  FileText,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Resources", path: "/resources" },
    { icon: FileText, label: "My Uploads", path: "/my-uploads" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Announcements", path: "/announcements" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: AlertCircle, label: "Lost & Found", path: "/lost-found" },
    { icon: Users, label: "Clubs", path: "/clubs" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  if (user?.role === "admin" || user?.role === "moderator") {
    menuItems.push({ icon: Settings, label: "Admin Panel", path: "/admin" });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[var(--bg-sidebar)] text-[var(--text-main)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-[var(--border-color)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 px-6 border-b border-[var(--border-color)] flex items-center">
            <Link to="/" className="flex items-center space-x-3 group min-w-0">
              <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <BookOpen size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="block text-xl font-bold tracking-tight text-[var(--text-main)] leading-none">
                  CRH
                </span>
                <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate">
                  Campus Resource Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-[var(--text-main)]"
                  }`}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                >
                  <item.icon
                    size={20}
                    className={isActive ? "text-white" : "group-hover:text-[var(--text-main)]"}
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-[var(--border-color)] space-y-2">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/30">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30 overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-[var(--text-main)]">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors group"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
