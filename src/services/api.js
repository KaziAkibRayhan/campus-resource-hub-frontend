import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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
  getMe: () => API.get("/auth/me"),
};

export const resourceService = {
  getAll: (params) => API.get("/resources", { params }),
  getById: (id) => API.get(`/resources/${id}`),
  upload: (formData) =>
    API.post("/resources", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMyUploads: () => API.get("/resources/user/my-uploads"),
  update: (id, data) => API.put(`/resources/${id}`, data),
  delete: (id) => API.delete(`/resources/${id}`),
  incrementDownload: (id) => API.put(`/resources/${id}/download`),
  approve: (id) => API.put(`/resources/${id}/approve`),
  reject: (id, reason) => API.put(`/resources/${id}/reject`, { reason }),
};

export const announcementService = {
  getAll: (params) => API.get("/announcements", { params }),
  create: (data) => API.post("/announcements", data),
  approve: (id) => API.put(`/announcements/${id}/approve`),
  reject: (id, reason) => API.put(`/announcements/${id}/reject`, { reason }),
  delete: (id) => API.delete(`/announcements/${id}`),
};

export const eventService = {
  getAll: (params) => API.get("/events", { params }),
  create: (data) => API.post("/events", data),
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
};

export const lostFoundService = {
  getAll: (params) => API.get("/lost-found", { params }),
  create: (formData) =>
    API.post("/lost-found", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    API.put(`/lost-found/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
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
  markAllRead: () => API.put("/notifications/read-all"),
};

export default API;
