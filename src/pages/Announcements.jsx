// src/pages/Announcements.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Bell, FileText, ImagePlus, Loader2, Paperclip, Plus, X } from "lucide-react";
import { announcementService } from "../services/api";
import { toast } from "sonner";
import { departments } from "../utils/constants";

const MAX_ATTACHMENTS = 5;

const fileTypeBadge = {
  PDF: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  DOC: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DOCX: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PPT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  PPTX: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  XLS: "bg-green-500/10 text-green-600 border-green-500/20",
  XLSX: "bg-green-500/10 text-green-600 border-green-500/20",
  TEXT: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  FILE: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const Announcements = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const fileInputRef = useRef(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: "",
    department: "All",
    content: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Realtime: keep the list in sync when anyone creates/updates/deletes
  useEffect(() => {
    if (!socket) return;

    const handleNew = (announcement) => {
      setAnnouncements((prev) =>
        prev.some((item) => item._id === announcement._id)
          ? prev
          : [announcement, ...prev]
      );
    };

    const handleUpdated = (announcement) => {
      setAnnouncements((prev) =>
        prev.map((item) => (item._id === announcement._id ? announcement : item))
      );
    };

    const handleDeleted = ({ announcementId }) => {
      setAnnouncements((prev) => prev.filter((item) => item._id !== announcementId));
    };

    socket.on("announcement:new", handleNew);
    socket.on("announcement:updated", handleUpdated);
    socket.on("announcement:deleted", handleDeleted);

    return () => {
      socket.off("announcement:new", handleNew);
      socket.off("announcement:updated", handleUpdated);
      socket.off("announcement:deleted", handleDeleted);
    };
  }, [socket]);

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

  const handleFilesSelected = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;

    const combined = [...files, ...selected].slice(0, MAX_ATTACHMENTS);
    if (files.length + selected.length > MAX_ATTACHMENTS) {
      toast.warning(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
    }
    setFiles(combined);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({ title: "", department: "All", content: "" });
    setFiles([]);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("department", form.department);
      formData.append("content", form.content);
      files.forEach((file) => formData.append("attachments", file));

      await announcementService.create(formData);
      toast.success("Announcement created");
      resetForm();
      setShowCreate(false);
      fetchAnnouncements();
    } catch (error) {
      console.error("Announcement create error:", error);
      toast.error(error.response?.data?.message || "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttachments = (announcement) => {
    const attachments = announcement.attachments || [];
    if (attachments.length === 0) return null;

    const images = attachments
      .map((attachment, index) => ({ ...attachment, index }))
      .filter((attachment) => attachment.fileType === "IMAGE");
    const docs = attachments
      .map((attachment, index) => ({ ...attachment, index }))
      .filter((attachment) => attachment.fileType !== "IMAGE");

    return (
      <div className="mt-4 space-y-3">
        {images.length > 0 && (
          <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-2 sm:grid-cols-3"}`}>
            {images.map((image) => (
              <a
                key={image.index}
                href={image.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-[var(--border-color)] hover:opacity-90 transition"
              >
                <img
                  src={image.fileUrl}
                  alt={image.fileName || "Announcement image"}
                  loading="lazy"
                  className="w-full h-40 object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {docs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {docs.map((doc) => (
              <a
                key={doc.index}
                href={announcementService.attachmentUrl(announcement._id, doc.index, { download: true })}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition group"
              >
                <FileText size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--text-main)] font-medium truncate max-w-[180px]">
                  {doc.fileName || "Attachment"}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${fileTypeBadge[doc.fileType] || fileTypeBadge.FILE}`}>
                  {doc.fileType}
                </span>
                {doc.fileSize > 0 && (
                  <span className="text-[10px] text-[var(--text-muted)]">{formatFileSize(doc.fileSize)}</span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    );
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
                      {announcement.attachments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip size={13} />
                          {announcement.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none text-[var(--text-main)] opacity-90 break-words">
                <p>{announcement.content}</p>
              </div>
              {renderAttachments(announcement)}
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

              {/* Attachments */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Attachments <span className="font-normal">(images, PDF, docs — max {MAX_ATTACHMENTS})</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= MAX_ATTACHMENTS}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[var(--border-color)] text-[var(--text-muted)] hover:border-blue-500 hover:text-blue-500 transition disabled:opacity-50"
                >
                  <ImagePlus size={18} />
                  <span className="text-sm font-medium">
                    {files.length > 0 ? "Add more files" : "Add images or documents"}
                  </span>
                </button>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0">
                            <FileText size={18} className="text-[var(--text-muted)]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-main)] truncate">{file.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-red-500 transition flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {submitting ? "Publishing..." : "Create"}
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
