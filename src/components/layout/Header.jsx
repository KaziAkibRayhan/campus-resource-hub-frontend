// src/components/layout/Header.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, Moon, Sun, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NotificationDropdown from "./NotificationDropdown";

const Header = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-color)] px-4 lg:px-8">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2.5 lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu size={22} className="text-[var(--text-main)]" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-[var(--text-main)]">
              Campus Resource Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 lg:space-x-5">
          {/* Search Bar */}
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-3 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 lg:w-80 pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none"
            />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 hover:rotate-12 group"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun size={22} className="text-yellow-400" />
            ) : (
              <Moon size={22} className="text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-2 lg:pl-4 border-l border-[var(--border-color)]">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-bold text-[var(--text-main)] leading-none mb-1">
                {user?.name}
              </p>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
            <Link to="/profile" className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full border-2 border-blue-600/20 p-0.5 hover:border-blue-600/50 transition-colors">
                <div className="h-full w-full rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-[var(--text-muted)]" />
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
