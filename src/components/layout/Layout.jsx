// src/components/layout/Layout.jsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatWidget from "../chat/ChatWidget";
import UploadProgressBar from "../common/UploadProgressBar";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "crh:sidebar-collapsed:v1";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const toggleSidebarCollapsed = () => setSidebarCollapsed((collapsed) => !collapsed);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // The layout still works when browser storage is unavailable.
    }
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen bg-[var(--bg-main)] transition-colors duration-300">
      <Toaster richColors position="top-right" />
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        toggleCollapsed={toggleSidebarCollapsed}
      />

      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
      >
        <Header toggleSidebar={toggleSidebar} />
        <UploadProgressBar />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-[var(--bg-main)]">
          <div className="mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Layout;
