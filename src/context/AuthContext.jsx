// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  // Verify token validity
  const verifyToken = useCallback(async () => {
    try {
      const response = await authService.getMe();
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token verification error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [verifyToken]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
        return { success: true, user: response.data.user };
      } else {
        return {
          success: false,
          error: response.data.message || "Login failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  const updateProfile = async (formData) => {
    try {
      const response = await authService.updateProfile(formData);
      if (response.data.success) {
        updateUser(response.data.user);
        return { success: true, user: response.data.user };
      }

      return {
        success: false,
        error: response.data.message || "Profile update failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Profile update failed",
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await authService.signup(userData);
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          email: response.data.email,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Signup failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Signup failed",
      };
    }
  };

  const verifySignupOtp = async (email, otp) => {
    try {
      const response = await authService.verifySignupOtp({ email, otp });
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
        return { success: true, user: response.data.user };
      }

      return {
        success: false,
        error: response.data.message || "Verification failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Verification failed",
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword({ email });
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to send reset code",
      };
    }
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    try {
      const response = await authService.resetPassword({ email, otp, newPassword });
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to reset password",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        verifySignupOtp,
        forgotPassword,
        resetPassword,
        logout,
        loading,
        updateUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
