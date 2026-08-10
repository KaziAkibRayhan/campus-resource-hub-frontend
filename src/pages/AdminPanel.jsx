// src/pages/AdminPanel.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users, FileText, HardDrive, Download, Trash2, BarChart2,
  Megaphone, Calendar, Search as SearchIcon, RefreshCw, Shield,
  Package, TrendingUp, Eye, Loader2, UserX,
  ShieldAlert, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  adminService,
  announcementService,
  eventService,
  lostFoundService,
  resourceService,
} from "../services/api";
import { toast } from "sonner";
import { useConfirm } from "../components/common/ConfirmDialog";
import { SkeletonRow } from "../components/common/Skeleton";

const TABS = [
  { id: "overview",     label: "Overview",      icon: BarChart2  },
  { id: "review",       label: "Review",         icon: ShieldAlert },
  { id: "resources",    label: "Resources",      icon: FileText   },
  { id: "content",      label: "Content",        icon: Megaphone  },
  { id: "users",        label: "Users",          icon: Users      },
];

const adminColors = {
  blue: {
    card: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    muted: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-500 dark:text-blue-300",
    soft: "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 border-blue-500",
  },
  green: {
    card: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50",
    text: "text-green-700 dark:text-green-300",
    muted: "text-green-600 dark:text-green-400",
    icon: "text-green-500 dark:text-green-300",
    soft: "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 border-green-500",
  },
  purple: {
    card: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50",
    text: "text-purple-700 dark:text-purple-300",
    muted: "text-purple-600 dark:text-purple-400",
    icon: "text-purple-500 dark:text-purple-300",
    soft: "bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/30 border-purple-500",
  },
  orange: {
    card: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50",
    text: "text-orange-700 dark:text-orange-300",
    muted: "text-orange-600 dark:text-orange-400",
    icon: "text-orange-500 dark:text-orange-300",
    soft: "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 border-orange-500",
  },
  red: {
    card: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50",
    text: "text-red-700 dark:text-red-300",
    muted: "text-red-600 dark:text-red-400",
    icon: "text-red-500 dark:text-red-300",
    soft: "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 border-red-500",
  },
};

const AdminPanel = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [searchParams, setSearchParams]   = useSearchParams();
  const [activeTab, setActiveTab]         = useState(searchParams.get("tab") || "overview");
  const [allResources, setAllResources]   = useState([]);
  const [pendingResources, setPendingResources] = useState([]);
  const [pendingLostFound, setPendingLostFound] = useState([]);
  const [reviewing, setReviewing]         = useState(null); // item id being approved/rejected
  const [confirmDelete, setConfirmDelete] = useState(null); // { label, onConfirm }
  const [deleting, setDeleting]           = useState(false);
  const [rejectTarget, setRejectTarget]   = useState(null); // item pending rejection
  const [rejectKind, setRejectKind]       = useState("resource"); // "resource" | "lostfound"
  const [rejectReason, setRejectReason]   = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents]               = useState([]);
  const [lostFound, setLostFound]         = useState([]);
  const [users, setUsers]                 = useState([]);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [failedSections, setFailedSections] = useState([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [userSearch, setUserSearch]         = useState("");
  const fetchSequence = useRef(0);

  const fmt  = (v = 0) => Intl.NumberFormat().format(v);
  const fmtB = (b = 0) => {
    if (!b) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
    return `${(b / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
  };

  // Fetch only the visible tab's data. Requests settle independently so one
  // slow endpoint cannot blank every section of the admin panel.
  const fetchData = useCallback(async () => {
    const requestId = ++fetchSequence.current;
    setLoading(true);
    setFailedSections([]);

    const requestsByTab = {
      overview: [
        ["resources", () => adminService.getAllResources({ limit: 100, sortBy: "createdAt", order: "desc" }), (res) => setAllResources(res.data.resources || [])],
        ["announcements", () => announcementService.getAll({ limit: 100 }), (res) => setAnnouncements(res.data.announcements || [])],
        ["events", () => eventService.getAll({ limit: 100 }), (res) => setEvents(res.data.events || [])],
        ["lost & found", () => lostFoundService.getAll({ limit: 100 }), (res) => setLostFound(res.data.items || [])],
        ["statistics", () => adminService.getStats(), (res) => setStats(res.data.stats)],
      ],
      review: [
        ["pending resources", () => resourceService.getAll({ isPending: true, limit: 100 }), (res) => setPendingResources(res.data.resources || [])],
        ["pending lost & found", () => lostFoundService.getPending(), (res) => setPendingLostFound(res.data.items || [])],
      ],
      resources: [
        ["resources", () => adminService.getAllResources({ limit: 100, sortBy: "createdAt", order: "desc" }), (res) => setAllResources(res.data.resources || [])],
      ],
      content: [
        ["announcements", () => announcementService.getAll({ limit: 100 }), (res) => setAnnouncements(res.data.announcements || [])],
        ["events", () => eventService.getAll({ limit: 100 }), (res) => setEvents(res.data.events || [])],
        ["lost & found", () => lostFoundService.getAll({ limit: 100 }), (res) => setLostFound(res.data.items || [])],
      ],
      users: [
        ["users", () => adminService.getUsers(), (res) => setUsers(res.data.users || [])],
      ],
    };

    const requests = requestsByTab[activeTab] || requestsByTab.overview;
    const results = await Promise.allSettled(requests.map(([, request]) => request()));
    if (requestId !== fetchSequence.current) return;
    const failures = [];

    results.forEach((result, index) => {
      const [label, , applyResult] = requests[index];
      if (result.status === "fulfilled") {
        applyResult(result.value);
      } else {
        failures.push(label);
        console.error(`Failed to load admin ${label}:`, result.reason);
      }
    });

    setFailedSections(failures);
    if (failures.length > 0) {
      toast.error(`Could not load: ${failures.join(", ")}`, {
        description: "Other dashboard data remains available. Use Refresh to retry.",
      });
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Delete helpers ──────────────────────────────────────────────
  const confirmAndDelete = (label, onConfirm) =>
    setConfirmDelete({ label, onConfirm });

  const handleDeleteResource = (id, title) =>
    confirmAndDelete(`resource "${title}"`, async () => {
      await resourceService.delete(id);
      toast.success("Resource deleted");
      fetchData();
    });

  const handleDeleteAnnouncement = (id, title) =>
    confirmAndDelete(`announcement "${title}"`, async () => {
      await announcementService.delete(id);
      toast.success("Announcement deleted");
      fetchData();
    });

  const handleDeleteEvent = (id, title) =>
    confirmAndDelete(`event "${title}"`, async () => {
      await eventService.delete(id);
      toast.success("Event deleted");
      fetchData();
    });

  const handleDeleteLostFound = (id, title) =>
    confirmAndDelete(`lost & found item "${title}"`, async () => {
      await lostFoundService.delete(id);
      toast.success("Item deleted");
      fetchData();
    });

  const handleDeleteUser = (targetUser) =>
    confirmAndDelete(`user "${targetUser.name}" and their notifications`, async () => {
      await adminService.deleteUser(targetUser._id);
      toast.success("User deleted");
      fetchData();
    });

  // ── Moderation review actions ───────────────────────────────────
  const handleApproveResource = async (resource) => {
    const ok = await confirm({
      title: "Publish this resource?",
      message: `"${resource.title}" was flagged by the safety check. Publishing will make it visible to all students.`,
      confirmText: "Publish",
      variant: "success",
    });
    if (!ok) return;
    setReviewing(resource._id);
    try {
      await resourceService.approve(resource._id);
      toast.success("Resource published", {
        description: `"${resource.title}" is now visible to all students.`,
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve resource");
    } finally {
      setReviewing(null);
    }
  };

  const handleApproveLostFound = async (item) => {
    const ok = await confirm({
      title: "Publish this item?",
      message: `"${item.item}" was flagged by the safety check. Publishing will make it visible to all students.`,
      confirmText: "Publish",
      variant: "success",
    });
    if (!ok) return;
    setReviewing(item._id);
    try {
      await lostFoundService.approve(item._id);
      toast.success("Item published", {
        description: `"${item.item}" is now visible on Lost & Found.`,
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve item");
    } finally {
      setReviewing(null);
    }
  };

  const openReject = (target, kind) => {
    setRejectTarget(target);
    setRejectKind(kind);
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    const label = rejectTarget.title || rejectTarget.item;
    setReviewing(rejectTarget._id);
    try {
      if (rejectKind === "lostfound") {
        await lostFoundService.reject(rejectTarget._id, rejectReason.trim());
      } else {
        await resourceService.reject(rejectTarget._id, rejectReason.trim());
      }
      toast.success(`"${label}" rejected`);
      setRejectTarget(null);
      setRejectReason("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setReviewing(null);
    }
  };

  // ── User actions ────────────────────────────────────────────────
  const handleToggleBlock = async (targetUser) => {
    const blocking = !targetUser.isBlocked;
    const ok = await confirm({
      title: blocking ? "Block this user?" : "Unblock this user?",
      message: blocking
        ? `${targetUser.name} will immediately lose access to the platform until unblocked.`
        : `${targetUser.name} will regain full access to the platform.`,
      confirmText: blocking ? "Block" : "Unblock",
      variant: blocking ? "warning" : "success",
    });
    if (!ok) return;
    try {
      await adminService.setUserBlocked(targetUser._id, blocking);
      toast.success(blocking ? "User blocked" : "User unblocked", {
        description: `${targetUser.name} ${blocking ? "can no longer access" : "can access"} the platform.`,
      });
      fetchData();
    } catch { toast.error("Failed to update user status"); }
  };

  const handleRoleChange = async (targetUser, role) => {
    const ok = await confirm({
      title: `Change role to ${role}?`,
      message: `${targetUser.name} (${targetUser.role}) will get the permissions of a ${role}.`,
      confirmText: "Change role",
      variant: "warning",
    });
    if (!ok) {
      // Controlled <select> — force a re-render so it snaps back to the real role.
      setUsers((prev) => [...prev]);
      return;
    }
    try {
      await adminService.updateUserRole(targetUser._id, role);
      toast.success("Role updated", {
        description: `${targetUser.name} is now a ${role}.`,
      });
      fetchData();
    } catch { toast.error("Failed to update role"); }
  };

  // ── Filtered ────────────────────────────────────────────────────
  const filteredResources = allResources.filter(
    (r) => !resourceSearch ||
      r.title?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.course?.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) => !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ────────────────────────────────────────────────────────────────
  // OVERVIEW
  // ────────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Resources",  value: stats?.resources?.total,          icon: FileText,   color: "blue"   },
          { label: "Active Users",     value: stats?.users?.active,             icon: Users,      color: "green"  },
          { label: "Total Downloads",  value: stats?.resources?.totalDownloads, icon: Download,   color: "purple" },
          { label: "Active Clubs",     value: stats?.clubs?.total,              icon: Package,    color: "orange" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label}
            className={`${adminColors[color].card} border rounded-xl p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`${adminColors[color].muted} text-sm font-medium`}>{label}</p>
              {React.createElement(Icon, {
                size: 18,
                className: adminColors[color].icon,
              })}
            </div>
            <p className={`text-3xl font-bold ${adminColors[color].text}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Content summary + System status + User stats */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Content summary */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Content Summary
          </h3>
          <div className="space-y-3">
            {[
              { label: "Resources",      count: allResources.length,  tab: "resources", color: "blue"   },
              { label: "Announcements",  count: announcements.length, tab: "content",   color: "purple" },
              { label: "Events",         count: events.length,        tab: "content",   color: "green"  },
              { label: "Lost & Found",   count: lostFound.length,     tab: "content",   color: "orange" },
            ].map(({ label, count, tab, color }) => (
              <button
                key={label}
                onClick={() => setActiveTab(tab)}
                className={`w-full p-3 ${adminColors[color].soft} border-l-4 rounded flex justify-between items-center transition`}
              >
                <span className="font-semibold text-[var(--text-main)]">{label}</span>
                <span className={`text-lg font-bold ${adminColors[color].muted}`}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <HardDrive size={20} className="text-green-500" /> System Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-[var(--text-main)]">Storage Used</p>
                <p className="text-sm text-[var(--text-muted)]">{fmtB(stats?.resources?.storageUsed)}</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: "45%" }} />
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg flex items-center justify-between border border-green-200/70 dark:border-green-900/40">
              <div>
                <p className="font-semibold text-[var(--text-main)]">Live Resources</p>
                <p className="text-sm text-[var(--text-muted)]">{fmt(stats?.resources?.approved)} visible</p>
              </div>
              <Eye size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg flex items-center justify-between border border-purple-200/70 dark:border-purple-900/40">
              <div>
                <p className="font-semibold text-[var(--text-main)]">Total Downloads</p>
                <p className="text-sm text-[var(--text-muted)]">{fmt(stats?.resources?.totalDownloads)}</p>
              </div>
              <Download size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* User stats */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-500" /> User Stats
          </h3>
          <div className="space-y-3">
            {[
              { label: "Total Users",  value: stats?.users?.total,      color: "blue"  },
              { label: "Students",     value: stats?.users?.students,    color: "green" },
              { label: "Moderators",   value: stats?.users?.moderators,  color: "purple"},
              { label: "Blocked",      value: stats?.users?.blocked,     color: "red"   },
            ].map(({ label, value, color }) => (
              <div key={label} className={`p-3 ${adminColors[color].card} border rounded-lg flex justify-between`}>
                <span className="font-semibold text-[var(--text-main)]">{label}</span>
                <span className={`font-bold ${adminColors[color].muted}`}>{fmt(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Resources quick table */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--text-main)]">Recent Resources</h3>
          <button onClick={() => setActiveTab("resources")} className="text-sm text-blue-600 hover:underline">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)] text-left">
              <tr>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Resource</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Uploader</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Downloads</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Date</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr><td colSpan={5} className="p-4"><SkeletonRow count={4} /></td></tr>
              ) : allResources.slice(0, 8).length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">No resources yet</td></tr>
              ) : (
                allResources.slice(0, 8).map((r) => (
                  <tr key={r._id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--text-main)] truncate max-w-[220px]">{r.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{r.course} · {r.fileType}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{r.uploadedBy?.name || "Unknown"}</td>
                    <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{r.downloads || 0}</td>
                    <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDeleteResource(r._id, r.title)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────────
  // REVIEW — AI-flagged uploads awaiting a publish/reject decision
  // ────────────────────────────────────────────────────────────────
  const renderReview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-500" />
            Flagged for Review ({pendingResources.length})
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            These uploads were flagged by the content safety check and are hidden
            until you approve or reject them.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-hover)] transition flex-shrink-0"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <SkeletonRow count={3} />
      ) : pendingResources.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-12 text-center">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-[var(--text-main)]">All clear</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Nothing is waiting for review right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingResources.map((r) => {
            const busy = reviewing === r._id;
            const categories = r.moderation?.categories || [];
            return (
              <div
                key={r._id}
                className="bg-[var(--bg-card)] rounded-xl border border-amber-200 dark:border-amber-900/50 p-5 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[var(--text-main)] truncate">{r.title}</p>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                        {r.fileType}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {r.course} · {r.department} · {r.uploadedBy?.name || "Unknown"} · {new Date(r.createdAt).toLocaleDateString()} · {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </p>
                    {r.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{r.description}</p>
                    )}
                    {categories.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <ShieldAlert size={14} /> Flagged for:
                        </span>
                        {categories.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium rounded-full capitalize"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={resourceService.fileUrl(r._id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-hover)] transition"
                    >
                      <Eye size={16} /> View
                    </a>
                    <button
                      onClick={() => handleApproveResource(r)}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      Publish
                    </button>
                    <button
                      onClick={() => openReject(r, "resource")}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lost & Found awaiting review */}
      <div className="pt-2">
        <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
          <Package size={20} className="text-amber-500" />
          Lost &amp; Found awaiting review ({pendingLostFound.length})
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 mb-3">
          Student posts flagged by the safety check or that couldn't be auto-checked.
        </p>

        {pendingLostFound.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-8 text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">No Lost &amp; Found posts waiting.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLostFound.map((it) => {
              const busy = reviewing === it._id;
              const categories = it.moderation?.categories || [];
              return (
                <div
                  key={it._id}
                  className="bg-[var(--bg-card)] rounded-xl border border-amber-200 dark:border-amber-900/50 p-5 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[var(--text-main)] truncate">{it.item}</p>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase">
                          {it.type}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {it.location} · {it.postedBy?.name || "Unknown"} · {new Date(it.createdAt).toLocaleDateString()} · {new Date(it.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                      {it.description && (
                        <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{it.description}</p>
                      )}
                      {categories.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <ShieldAlert size={14} /> Flagged for:
                          </span>
                          {categories.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium rounded-full capitalize"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 flex items-center gap-1">
                          <Clock size={13} /> Could not be auto-checked — manual review needed.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {it.imageUrl && (
                        <a
                          href={it.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-hover)] transition"
                        >
                          <Eye size={16} /> View
                        </a>
                      )}
                      <button
                        onClick={() => handleApproveLostFound(it)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
                      >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Publish
                      </button>
                      <button
                        onClick={() => openReject(it, "lostfound")}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────────
  // RESOURCES
  // ────────────────────────────────────────────────────────────────
  const renderResources = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search resources..."
            value={resourceSearch}
            onChange={(e) => setResourceSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-hover)] transition"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h3 className="font-bold text-[var(--text-main)]">All Resources ({filteredResources.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)] text-left">
              <tr>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Resource</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Uploader</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Type</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Downloads</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Date</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr><td colSpan={6} className="p-4"><SkeletonRow count={5} /></td></tr>
              ) : filteredResources.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">No resources found</td></tr>
              ) : (
                filteredResources.map((r) => (
                  <tr key={r._id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--text-main)] max-w-xs truncate">{r.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{r.course} · {r.department}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{r.uploadedBy?.name || "Unknown"}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                        {r.fileType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{r.downloads || 0}</td>
                    <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDeleteResource(r._id, r.title)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────────
  // CONTENT (announcements · events · lost & found)
  // ────────────────────────────────────────────────────────────────
  const ContentSection = ({ title, icon: Icon, items, color, renderRow }) => (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
      <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-3">
        {React.createElement(Icon, {
          size: 20,
          className: adminColors[color].icon,
        })}
        <h3 className="font-bold text-[var(--text-main)]">{title} <span className="text-[var(--text-muted)] font-normal">({items.length})</span></h3>
      </div>
      <div className="divide-y divide-[var(--border-color)]">
        {loading ? (
          <div className="p-6 text-center text-[var(--text-muted)]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-[var(--text-muted)]">Nothing here yet</div>
        ) : (
          items.map((item) => renderRow(item))
        )}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {/* Announcements */}
      <ContentSection
        title="Announcements"
        icon={Megaphone}
        items={announcements}
        color="purple"
        renderRow={(item) => (
          <div key={item._id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] transition">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--text-main)] truncate">{item.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {item.department} · {item.postedBy?.name || "Unknown"} · {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDeleteAnnouncement(item._id, item.title)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      {/* Events */}
      <ContentSection
        title="Events"
        icon={Calendar}
        items={events}
        color="green"
        renderRow={(item) => (
          <div key={item._id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] transition">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--text-main)] truncate">{item.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {item.club} · {new Date(item.date).toLocaleDateString()} · {item.location}
              </p>
            </div>
            <button
              onClick={() => handleDeleteEvent(item._id, item.title)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      {/* Lost & Found */}
      <ContentSection
        title="Lost & Found Items"
        icon={Package}
        items={lostFound}
        color="orange"
        renderRow={(item) => (
          <div key={item._id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] transition">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--text-main)] truncate">{item.item}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">
                {item.type} · {item.location} · {item.postedBy?.name || "Unknown"} · {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
              item.type === "lost"
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            }`}>
              {item.type?.toUpperCase()}
            </span>
            <button
              onClick={() => handleDeleteLostFound(item._id, item.item)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />
    </div>
  );

  // ────────────────────────────────────────────────────────────────
  // USERS
  // ────────────────────────────────────────────────────────────────
  const renderUsers = () => (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={18} />
        <input
          type="text"
          placeholder="Search users..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h3 className="font-bold text-[var(--text-main)]">All Users ({filteredUsers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)] text-left">
              <tr>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">User</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Department</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Role</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)]">Status</th>
                <th className="px-5 py-3 text-sm font-semibold text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-[var(--bg-hover)] transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[var(--text-main)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{u.department || "—"}</td>
                  <td className="px-5 py-4">
                    {user?.role === "admin" ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="px-3 py-1 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="student">Student</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="text-sm text-[var(--text-muted)] capitalize">{u.role}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      u.isBlocked
                        ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    }`}>
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleBlock(u)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          u.isBlocked
                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                      {user?.role === "admin" && u._id !== user._id && u.role !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-500/10 transition"
                          title="Delete user"
                        >
                          <UserX size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)] flex items-center gap-3">
            <Shield className="text-blue-600" size={32} /> Admin Panel
          </h2>
          <p className="text-[var(--text-muted)] mt-1">Full platform management &amp; control</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-hover)] transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSearchParams(id === "overview" ? {} : { tab: id }); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {React.createElement(Icon, { size: 16 })}
            {label}
            {id === "review" && pendingResources.length + pendingLostFound.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === id ? "bg-white text-red-600" : "bg-red-500 text-white"
              }`}>
                {pendingResources.length + pendingLostFound.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {failedSections.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <div>
            <p className="font-semibold">Some data could not be loaded</p>
            <p className="text-sm opacity-90">
              Unavailable: {failedSections.join(", ")}. Existing data has been kept.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/30"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Retry
          </button>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "overview"  && renderOverview()}
      {activeTab === "review"    && renderReview()}
      {activeTab === "resources" && renderResources()}
      {activeTab === "content"   && renderContent()}
      {activeTab === "users"     && renderUsers()}

      {/* Reject Resource Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-6 max-w-md w-full border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <XCircle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-main)] text-lg">
                  Reject {rejectKind === "lostfound" ? "Item" : "Resource"}
                </h3>
                <p className="text-sm text-[var(--text-muted)] truncate max-w-[260px]">{rejectTarget.title || rejectTarget.item}</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              Reason (shown to the uploader)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Contains content that violates community guidelines."
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                disabled={reviewing === rejectTarget._id}
                className="flex-1 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-main)] rounded-xl hover:bg-[var(--bg-hover)] transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={reviewing === rejectTarget._id}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {reviewing === rejectTarget._id && <Loader2 size={16} className="animate-spin" />}
                {reviewing === rejectTarget._id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-6 max-w-md w-full border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-main)] text-lg">Confirm Delete</h3>
                <p className="text-sm text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-[var(--text-main)] mb-6">
              Are you sure you want to delete <strong>{confirmDelete.label}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-main)] rounded-xl hover:bg-[var(--bg-hover)] transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await confirmDelete.onConfirm();
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Delete failed");
                  } finally {
                    setDeleting(false);
                    setConfirmDelete(null);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
