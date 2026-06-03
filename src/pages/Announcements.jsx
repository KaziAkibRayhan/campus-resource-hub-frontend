// src/pages/Announcements.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Plus, X } from "lucide-react";
import { announcementService } from "../services/api";
import { toast } from "sonner";
import { departments } from "../utils/constants";

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    department: "All",
    content: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAll();
      setAnnouncements(response.data.announcements);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await announcementService.create(form);
      toast.success("Announcement created");
      setForm({ title: "", department: "All", content: "" });
      setShowCreate(false);
      fetchAnnouncements();
    } catch (error) {
      console.error("Announcement create error:", error);
      toast.error(error.response?.data?.message || "Failed to create announcement");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] break-words">
            Announcements
          </h2>
          <p className="text-[var(--text-muted)] mt-1">Stay updated with campus news</p>
        </div>
        {(user?.role === "admin" || user?.role === "moderator") && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
          >
            <Plus size={20} className="flex-shrink-0" />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition border border-[var(--border-color)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 sm:p-3 rounded-lg flex-shrink-0">
                    <Bell className="text-blue-600 dark:text-blue-400" size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] mb-2 break-words">
                      {announcement.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--text-muted)]">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                        {announcement.department}
                      </span>
                      <span className="break-words">Posted by {announcement.postedBy?.name || "Admin"}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none text-[var(--text-main)] opacity-90 break-words">
                <p>{announcement.content}</p>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-12 bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)]">
              <Bell size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">
                No announcements yet
              </h3>
              <p className="text-[var(--text-muted)]">
                Check back later for campus updates.
              </p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] shadow-2xl overflow-hidden border border-[var(--border-color)]">
            <div className="p-4 sm:p-6 border-b border-[var(--border-color)] flex items-center justify-between gap-3">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
                Create Announcement
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)]"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-7rem)]">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="w-full px-4 py-3"
                >
                  <option value="All">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Content
                </label>
                <textarea
                  required
                  rows="5"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-4 py-3"
                  placeholder="Announcement details..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-main)] py-3 rounded-lg font-bold hover:bg-[var(--bg-hover)] transition border border-[var(--border-color)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
