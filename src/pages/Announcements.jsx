// src/pages/Announcements.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import useDebounce from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  Bell,
  FileText,
  ImagePlus,
  Loader2,
  Megaphone,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCheck,
  Trash2,
  X,
} from "lucide-react";
import { announcementService } from "../services/api";
import { toast } from "sonner";
import { departments } from "../utils/constants";
import useHighlight from "../hooks/useHighlight";
import { useConfirm } from "../components/common/ConfirmDialog";
import { SkeletonRow } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { isCanceledRequest } from "../utils/request";

const MAX_ATTACHMENTS = 5;
const PAGE_SIZE = 20;

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

const priorityStyles = {
  urgent: { border: "border-l-4 border-l-red-500", badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300", label: "Urgent" },
  important: { border: "border-l-4 border-l-amber-500", badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300", label: "Important" },
  normal: { border: "", badge: "", label: "" },
};

const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const Announcements = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const confirm = useConfirm();
  const fileInputRef = useRef(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  useHighlight(!loading);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const [deptFilter, setDeptFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRequestRef = useRef(null);

  const emptyForm = {
    title: "",
    department: "All",
    content: "",
    priority: "normal",
    pinned: false,
    publishAt: "",
    expiresAt: "",
  };
  const [form, setForm] = useState(emptyForm);

  const canManage = user?.role === "admin" || user?.role === "moderator";

  const fetchAnnouncements = useCallback(
    async (targetPage = 1, append = false) => {
      const controller = new AbortController();
      listRequestRef.current?.abort();
      listRequestRef.current = controller;
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const params = { page: targetPage, limit: PAGE_SIZE };
        if (deptFilter !== "All") params.department = deptFilter;
        if (priorityFilter !== "all") params.priority = priorityFilter;
        if (debouncedSearch) params.search = debouncedSearch;
        if (archived) params.scope = "archived";
        const response = await announcementService.getAll(params, { signal: controller.signal });
        const fetched = response.data.announcements || [];
        setTotalPages(response.data.totalPages || 1);
        setPage(response.data.currentPage || targetPage);
        setAnnouncements((prev) => (append ? [...prev, ...fetched] : fetched));
      } catch (error) {
        if (isCanceledRequest(error)) return;
        toast.error(error.response?.data?.message || "Failed to fetch announcements");
      } finally {
        if (listRequestRef.current === controller) {
          append ? setLoadingMore(false) : setLoading(false);
        }
      }
    },
    [deptFilter, priorityFilter, debouncedSearch, archived]
  );

  useEffect(() => {
    fetchAnnouncements(1, false);
    return () => listRequestRef.current?.abort();
  }, [fetchAnnouncements]);

  // Realtime
  useEffect(() => {
    if (!socket) return;
    const handleNew = (announcement) =>
      setAnnouncements((prev) =>
        prev.some((item) => item._id === announcement._id) ? prev : [announcement, ...prev]
      );
    const handleUpdated = (announcement) =>
      setAnnouncements((prev) =>
        prev.map((item) => (item._id === announcement._id ? { ...item, ...announcement } : item))
      );
    const handleDeleted = ({ announcementId }) =>
      setAnnouncements((prev) => prev.filter((item) => item._id !== announcementId));

    socket.on("announcement:new", handleNew);
    socket.on("announcement:updated", handleUpdated);
    socket.on("announcement:deleted", handleDeleted);
    return () => {
      socket.off("announcement:new", handleNew);
      socket.off("announcement:updated", handleUpdated);
      socket.off("announcement:deleted", handleDeleted);
    };
  }, [socket]);

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

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("department", form.department);
      formData.append("content", form.content);
      formData.append("priority", form.priority);
      formData.append("pinned", form.pinned ? "true" : "false");
      if (form.publishAt) formData.append("publishAt", new Date(form.publishAt).toISOString());
      if (form.expiresAt) formData.append("expiresAt", new Date(form.expiresAt).toISOString());
      files.forEach((file) => formData.append("attachments", file));

      const res = await announcementService.create(formData);
      toast.success(res.data.message || "Announcement created");
      setForm(emptyForm);
      setFiles([]);
      setShowCreate(false);
      fetchAnnouncements(1, false);
    } catch (error) {
      const data = error.response?.data;
      toast.error(data?.code === "CONTENT_REJECTED" ? data.message : data?.message || "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const markRead = async (announcement) => {
    if (announcement.isRead) return;
    setAnnouncements((prev) =>
      prev.map((a) => (a._id === announcement._id ? { ...a, isRead: true } : a))
    );
    try {
      await announcementService.markRead(announcement._id);
    } catch {
      /* non-critical */
    }
  };

  const togglePin = async (announcement) => {
    try {
      setBusyId(announcement._id);
      const res = await announcementService.togglePin(announcement._id);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === announcement._id ? { ...a, pinned: res.data.announcement.pinned } : a))
      );
      toast.success(
        res.data.message ||
          (res.data.announcement.pinned ? "Announcement pinned" : "Announcement unpinned")
      );
      fetchAnnouncements(1, false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update pin");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (announcement) => {
    const ok = await confirm({
      title: "Delete announcement?",
      message: `"${announcement.title}" will be permanently removed. This cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      setBusyId(announcement._id);
      await announcementService.delete(announcement._id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== announcement._id));
      toast.success("Announcement deleted", {
        description: `"${announcement.title}" has been removed.`,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const renderAttachments = (announcement) => {
    const attachments = announcement.attachments || [];
    if (attachments.length === 0) return null;
    const images = attachments.map((a, index) => ({ ...a, index })).filter((a) => a.fileType === "IMAGE");
    const docs = attachments.map((a, index) => ({ ...a, index })).filter((a) => a.fileType !== "IMAGE");

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
                <img src={image.fileUrl} alt={image.fileName || "Announcement image"} loading="lazy" className="w-full h-40 object-cover" />
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition"
              >
                <FileText size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--text-main)] font-medium truncate max-w-[180px]">{doc.fileName || "Attachment"}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${fileTypeBadge[doc.fileType] || fileTypeBadge.FILE}`}>{doc.fileType}</span>
                {doc.fileSize > 0 && <span className="text-[10px] text-[var(--text-muted)]">{formatFileSize(doc.fileSize)}</span>}
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
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Megaphone size={24} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] break-words">Announcements</h2>
            <p className="text-[var(--text-muted)] mt-1">Stay updated with campus news</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <Plus size={20} className="flex-shrink-0" />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 border border-[var(--border-color)] flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
            <option value="All">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm">
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="important">Important</option>
            <option value="normal">Normal</option>
          </select>
          <button
            onClick={() => setArchived((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              archived ? "bg-blue-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {archived ? "Showing archived" : "Archived"}
          </button>
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-3 text-[var(--text-muted)]" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..." className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <SkeletonRow count={5} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={archived ? "No archived announcements" : "No announcements"}
          hint={
            debouncedSearch || deptFilter !== "All" || priorityFilter !== "all"
              ? "Try a different search or clear the filters."
              : archived
              ? "Expired announcements will show up here."
              : "Check back later for campus updates."
          }
          actionLabel={canManage && !archived ? "Create announcement" : undefined}
          onAction={canManage && !archived ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <>
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const pr = priorityStyles[announcement.priority] || priorityStyles.normal;
              const unread = !announcement.isRead;
              return (
                <div
                  id={`hl-${announcement._id}`}
                  key={announcement._id}
                  onClick={() => markRead(announcement)}
                  className={`bg-[var(--bg-card)] rounded-xl shadow-sm p-4 sm:p-6 transition hover:shadow-lg hover:-translate-y-0.5 border border-[var(--border-color)] ${pr.border} ${
                    unread ? "ring-1 ring-blue-500/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 sm:p-3 rounded-lg flex-shrink-0 relative">
                        <Bell className="text-blue-600 dark:text-blue-400" size={22} />
                        {unread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[var(--bg-card)]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {announcement.pinned && <Pin size={15} className="text-blue-500" />}
                          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] break-words">{announcement.title}</h3>
                          {pr.label && (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${pr.badge}`}>
                              {announcement.priority === "urgent" && <AlertTriangle size={11} />}
                              {pr.label}
                            </span>
                          )}
                          {announcement.isScheduled && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <Clock size={11} /> Scheduled
                            </span>
                          )}
                          {announcement.isExpired && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--text-muted)]">
                          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">{announcement.department}</span>
                          <span className="break-words">Posted by {announcement.postedBy?.name || "Admin"}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(announcement.publishAt || announcement.createdAt).toLocaleDateString()}</span>
                          {announcement.attachments?.length > 0 && (
                            <span className="flex items-center gap-1"><Paperclip size={13} />{announcement.attachments.length}</span>
                          )}
                          {canManage && typeof announcement.readCount === "number" && (
                            <span className="flex items-center gap-1"><CheckCheck size={13} />{announcement.readCount} read</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => togglePin(announcement)}
                          disabled={busyId === announcement._id}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                          title={announcement.pinned ? "Unpin" : "Pin"}
                        >
                          {announcement.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(announcement)}
                          disabled={busyId === announcement._id}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-[var(--text-main)] opacity-90 break-words">
                    <p>{announcement.content}</p>
                  </div>
                  {renderAttachments(announcement)}
                </div>
              );
            })}
          </div>
          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchAnnouncements(page + 1, true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] shadow-2xl overflow-hidden border border-[var(--border-color)]">
            <div className="p-4 sm:p-6 border-b border-[var(--border-color)] flex items-center justify-between gap-3">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">Create Announcement</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)]">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-7rem)]">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Title</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3" placeholder="Announcement title" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-3">
                    <option value="All">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-3">
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Content</label>
                <textarea required rows="5" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-4 py-3" placeholder="Announcement details..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Publish at (optional)</label>
                  <input type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} className="w-full px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">Expires at (optional)</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-4 py-3" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
                Pin to top
              </label>

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
                  <span className="text-sm font-medium">{files.length > 0 ? "Add more files" : "Add images or documents"}</span>
                </button>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                        {file.type.startsWith("image/") ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0">
                            <FileText size={18} className="text-[var(--text-muted)]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-main)] truncate">{file.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{formatFileSize(file.size)}</p>
                        </div>
                        <button type="button" onClick={() => removeFile(index)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-red-500 transition flex-shrink-0">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {submitting ? "Saving..." : "Create"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-main)] py-3 rounded-lg font-bold hover:bg-[var(--bg-hover)] transition border border-[var(--border-color)]">
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
