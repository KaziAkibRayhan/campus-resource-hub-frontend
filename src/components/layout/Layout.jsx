// src/components/layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatWidget from "../chat/ChatWidget";
import UploadProgressBar from "../common/UploadProgressBar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-[var(--bg-main)] transition-colors duration-300">
      <Toaster richColors position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-72">
        <Header toggleSidebar={toggleSidebar} />
        <UploadProgressBar />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-[var(--bg-main)]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Layout;
