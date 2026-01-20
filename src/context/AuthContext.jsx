// src/context/AuthContext.jsx (Updated for Backend API)
import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      // Optionally verify token by calling /api/auth/me
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token validity
  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          // Token invalid, clear storage
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token verification error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        return { success: true, user: data.user };
      } else {
        // Handle validation errors
        if (data.errors) {
          const errorMessages = data.errors
            .map((err) => err.message)
            .join(", ");
          return { success: false, error: errorMessages };
        }
        return { success: false, error: data.message || "Signup failed" };
      }
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Update user profile
  const updateUser = async (updatedData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: data.message || "Update failed" };
      }
    } catch (error) {
      console.error("Update error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        // Update token if new one is provided
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          error: data.message || "Password change failed",
        };
      }
    } catch (error) {
      console.error("Change password error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateUser,
    changePassword,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
