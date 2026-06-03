import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to headers if it exists in localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => API.post("/auth/login", credentials),
  signup: (userData) => API.post("/auth/signup", userData),
  verifySignupOtp: (data) => API.post("/auth/verify-signup-otp", data),
  forgotPassword: (data) => API.post("/auth/forgot-password", data),
  verifyResetOtp: (data) => API.post("/auth/verify-reset-otp", data),
  resetPassword: (data) => API.post("/auth/reset-password", data),
  getMe: () => API.get("/auth/me"),
  updateProfile: (formData) => API.put("/auth/update-profile", formData),
};

export const resourceService = {
  getAll: (params) => API.get("/resources", { params }),
  getById: (id) => API.get(`/resources/${id}`),
  upload: (formData) => API.post("/resources", formData),
  getMyUploads: () => API.get("/resources/user/my-uploads"),
  update: (id, data) => API.put(`/resources/${id}`, data),
  delete: (id) => API.delete(`/resources/${id}`),
  incrementDownload: (id) => API.put(`/resources/${id}/download`),
  approve: (id) => API.put(`/resources/${id}/approve`),
  reject: (id, reason) => API.put(`/resources/${id}/reject`, { reason }),
};

export const announcementService = {
  getAll: (params) => API.get("/announcements", { params }),
  getMine: () => API.get("/announcements", { params: { mine: true } }),
  create: (data) => API.post("/announcements", data),
  update: (id, data) => API.put(`/announcements/${id}`, data),
  approve: (id) => API.put(`/announcements/${id}/approve`),
  reject: (id, reason) => API.put(`/announcements/${id}/reject`, { reason }),
  delete: (id) => API.delete(`/announcements/${id}`),
};

export const eventService = {
  getAll: (params) => API.get("/events", { params }),
  getMine: () => API.get("/events", { params: { mine: true } }),
  create: (data) => API.post("/events", data),
  update: (id, data) => API.put(`/events/${id}`, data),
  register: (id) => API.post(`/events/${id}/register`),
  approve: (id) => API.put(`/events/${id}/approve`),
  reject: (id, reason) => API.put(`/events/${id}/reject`, { reason }),
  delete: (id) => API.delete(`/events/${id}`),
};

export const adminService = {
  getStats: () => API.get("/admin/stats"),
  getUsers: (params) => API.get("/admin/users", { params }),
  setUserBlocked: (id, isBlocked) =>
    API.put(`/admin/users/${id}/block`, { isBlocked }),
  updateUserRole: (id, role) => API.put(`/admin/users/${id}/role`, { role }),
  getAllResources: (params) => API.get("/resources", { params: { ...params, all: true } }),
};

export const lostFoundService = {
  getAll: (params) => API.get("/lost-found", { params }),
  getMine: () => API.get("/lost-found", { params: { mine: true } }),
  create: (formData) => API.post("/lost-found", formData),
  update: (id, formData) => API.put(`/lost-found/${id}`, formData),
  delete: (id) => API.delete(`/lost-found/${id}`),
  approve: (id) => API.put(`/lost-found/${id}/approve`),
  reject: (id, reason) => API.put(`/lost-found/${id}/reject`, { reason }),
};

export const clubService = {
  getAll: (params) => API.get("/clubs", { params }),
  create: (data) => API.post("/clubs", data),
  join: (id) => API.post(`/clubs/${id}/join`),
  leave: (id) => API.delete(`/clubs/${id}/leave`),
  delete: (id) => API.delete(`/clubs/${id}`),
};

export const notificationService = {
  getAll: () => API.get("/notifications"),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put("/notifications/read-all"),
  delete: (id) => API.delete(`/notifications/${id}`),
};

export const chatService = {
  verifyAccess: () => API.post("/chat/verify"),
  searchHub: (params) => API.get("/chat/search", { params }),
  askAssistant: (question) => API.post("/chat/assistant", { question }),
  getUsers: () => API.get("/chat/users"),
  getConversations: () => API.get("/chat/conversations"),
  createDirect: (userId) => API.post("/chat/conversations/direct", { userId }),
  createGroup: (data) => API.post("/chat/conversations/group", data),
  getMessages: (id) => API.get(`/chat/conversations/${id}/messages`),
  updateGroupInfo: (id, data) => API.patch(`/chat/conversations/${id}/info`, data),
  addMembers: (id, memberIds) => API.post(`/chat/conversations/${id}/members`, { memberIds }),
  removeMember: (id, userId) => API.delete(`/chat/conversations/${id}/members`, { data: { userId } }),
  promoteAdmin: (id, userId) => API.post(`/chat/conversations/${id}/admins`, { userId }),
  demoteAdmin: (id, userId) => API.delete(`/chat/conversations/${id}/admins`, { data: { userId } }),
  leaveGroup: (id) => API.post(`/chat/conversations/${id}/leave`),
  uploadAttachment: (formData, onUploadProgress) =>
    API.post("/chat/attachments", formData, {
      onUploadProgress,
    }),
  downloadAttachment: (messageId, attachmentIndex) =>
    API.get(`/chat/messages/${messageId}/attachments/${attachmentIndex}/download`),
};

export default API;
