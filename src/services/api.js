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
  incrementDownload: (id) => API.put(`/resources/${id}/download`),
  approve: (id) => API.put(`/resources/${id}/approve`),
  reject: (id) => API.put(`/resources/${id}/reject`),
};

export const announcementService = {
  getAll: (params) => API.get("/announcements", { params }),
  create: (data) => API.post("/announcements", data),
  approve: (id) => API.put(`/announcements/${id}/approve`),
  delete: (id) => API.delete(`/announcements/${id}`),
};

export const eventService = {
  getAll: (params) => API.get("/events", { params }),
  create: (data) => API.post("/events", data),
  approve: (id) => API.put(`/events/${id}/approve`),
  delete: (id) => API.delete(`/events/${id}`),
};

export default API;
