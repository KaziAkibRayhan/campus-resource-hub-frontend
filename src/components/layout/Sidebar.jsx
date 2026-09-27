// src/components/layout/Sidebar.jsx
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, isCollapsed, toggleSidebar, toggleCollapsed }) => {
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
        id="primary-sidebar"
        className={`fixed left-0 top-0 z-50 h-full w-72 transform border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] text-[var(--text-main)] transition-[transform,width] duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-72"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`relative flex h-20 items-center border-b border-[var(--border-color)] px-6 transition-[padding] duration-300 ${
              isCollapsed ? "lg:justify-center lg:px-3" : ""
            }`}
          >
            <Link
              to="/"
              aria-label="Campus Resource Hub home"
              className={`group flex min-w-0 items-center space-x-3 ${
                isCollapsed ? "lg:justify-center lg:space-x-0" : ""
              }`}
            >
              <div className="shrink-0 rounded-xl bg-blue-600 p-2 transition-transform group-hover:scale-110">
                <BookOpen size={24} className="text-white" />
              </div>
              <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
                <span className="block text-xl font-bold tracking-tight text-[var(--text-main)] leading-none">
                  CRH
                </span>
                <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate">
                  Campus Resource Hub
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
              aria-controls="primary-sidebar"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="absolute bottom-0 right-0 hidden h-7 w-7 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] shadow-md hover:border-blue-500/50 hover:bg-[var(--bg-hover)] hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:flex"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Primary navigation"
            className={`custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6 transition-[padding] duration-300 ${
              isCollapsed ? "lg:px-3" : ""
            }`}
          >
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative flex items-center space-x-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isCollapsed ? "lg:justify-center lg:space-x-0 lg:px-3" : ""
                  } ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-[var(--text-main)]"
                  }`}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                >
                  <item.icon
                    size={20}
                    className={`shrink-0 ${
                      isActive ? "text-white" : "group-hover:text-[var(--text-main)]"
                    }`}
                  />
                  <span className={`font-medium ${isCollapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div
            className={`space-y-2 border-t border-[var(--border-color)] p-4 transition-[padding] duration-300 ${
              isCollapsed ? "lg:p-3" : ""
            }`}
          >
            <div
              title={isCollapsed ? `${user?.name || "User"} · ${user?.role || "Member"}` : undefined}
              className={`flex items-center space-x-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-slate-800/30 ${
                isCollapsed ? "lg:justify-center lg:space-x-0 lg:px-2" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-600/30 bg-blue-600/20">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className={`min-w-0 flex-1 ${isCollapsed ? "lg:hidden" : ""}`}>
                <p className="text-sm font-bold truncate text-[var(--text-main)]">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              aria-label="Logout"
              title={isCollapsed ? "Logout" : undefined}
              className={`group flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400 ${
                isCollapsed ? "lg:justify-center lg:space-x-0 lg:px-3" : ""
              }`}
            >
              <LogOut size={20} className="shrink-0 transition-transform group-hover:scale-110" />
              <span className={`font-medium ${isCollapsed ? "lg:hidden" : ""}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
