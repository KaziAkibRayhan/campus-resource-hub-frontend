// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { UploadProvider } from "./context/UploadContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/layout/Layout";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Main Pages
import Dashboard from "./pages/Dashboard";
import Resources from "./pages/Resources";
import UploadResource from "./pages/UploadResource";
import Messages from "./pages/Messages";
import MyUploads from "./pages/MyUploads";
import Announcements from "./pages/Announcements";
import Events from "./pages/Events";
import LostFound from "./pages/LostFound";
import Clubs from "./pages/Clubs";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <UploadProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="upload-resource" element={<UploadResource />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="my-uploads" element={<MyUploads />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="events" element={<Events />} />
                  <Route path="lost-found" element={<LostFound />} />
                  <Route path="clubs" element={<Clubs />} />
                  <Route path="profile" element={<Profile />} />

                  {/* Admin Only Route */}
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "moderator"]}>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* 404 Redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
            </UploadProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
