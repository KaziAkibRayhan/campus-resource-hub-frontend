// src/components/layout/Header.jsx
import React from "react";
import { Menu, Bell, Search } from "lucide-react";

const Header = ({ setSidebarOpen, title = "Campus Resource Hub" }) => {
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
          <button className="relative hover:bg-gray-100 p-2 rounded-lg transition">
            <Bell size={24} className="text-gray-600" />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
