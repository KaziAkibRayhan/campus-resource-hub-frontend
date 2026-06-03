// src/pages/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Users, FileText, HardDrive, Download, Trash2, BarChart2,
  Megaphone, Calendar, Search as SearchIcon, RefreshCw, Shield,
  Package, TrendingUp, Eye,
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

const TABS = [
  { id: "overview",     label: "Overview",      icon: BarChart2  },
  { id: "resources",    label: "Resources",      icon: FileText   },
  { id: "content",      label: "Content",        icon: Megaphone  },
  { id: "users",        label: "Users",          icon: Users      },
];

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]         = useState("overview");
  const [allResources, setAllResources]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents]               = useState([]);
  const [lostFound, setLostFound]         = useState([]);
  const [users, setUsers]                 = useState([]);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [resourceSearch, setResourceSearch] = useState("");
  const [userSearch, setUserSearch]         = useState("");
  const [confirmDelete, setConfirmDelete]   = useState(null);

  const fmt  = (v = 0) => Intl.NumberFormat().format(v);
  const fmtB = (b = 0) => {
    if (!b) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
    return `${(b / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
  };

  // ── Fetch all data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, annRes, evtRes, lfRes, usrRes, stRes] = await Promise.all([
        adminService.getAllResources({ limit: 100, sortBy: "createdAt", order: "desc" }),
        announcementService.getAll(),          // admin sees all
        eventService.getAll(),                 // admin sees all
        lostFoundService.getAll(),             // admin sees all
        adminService.getUsers(),
        adminService.getStats(),
      ]);
      setAllResources(allRes.data.resources     || []);
      setAnnouncements(annRes.data.announcements || []);
      setEvents(evtRes.data.events               || []);
      setLostFound(lfRes.data.items              || []);
      setUsers(usrRes.data.users                 || []);
      setStats(stRes.data.stats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

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

  // ── User actions ────────────────────────────────────────────────
  const handleToggleBlock = async (targetUser) => {
    try {
      await adminService.setUserBlocked(targetUser._id, !targetUser.isBlocked);
      toast.success(targetUser.isBlocked ? "User unblocked" : "User blocked");
      fetchData();
    } catch { toast.error("Failed to update user status"); }
  };

  const handleRoleChange = async (targetUser, role) => {
    try {
      await adminService.updateUserRole(targetUser._id, role);
      toast.success("Role updated");
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
            className={`bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800 rounded-xl p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`text-${color}-600 dark:text-${color}-400 text-sm font-medium`}>{label}</p>
              {React.createElement(Icon, {
                size: 18,
                className: `text-${color}-400`,
              })}
            </div>
            <p className={`text-3xl font-bold text-${color}-700 dark:text-${color}-300`}>{fmt(value)}</p>
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
                className={`w-full p-3 bg-${color}-50 dark:bg-${color}-900/10 border-l-4 border-${color}-500 rounded flex justify-between items-center hover:bg-${color}-100 dark:hover:bg-${color}-900/20 transition`}
              >
                <span className="font-semibold text-[var(--text-main)]">{label}</span>
                <span className={`text-lg font-bold text-${color}-600`}>{count}</span>
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
            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--text-main)]">Live Resources</p>
                <p className="text-sm text-[var(--text-muted)]">{fmt(stats?.resources?.approved)} visible</p>
              </div>
              <Eye size={20} className="text-green-600" />
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--text-main)]">Total Downloads</p>
                <p className="text-sm text-[var(--text-muted)]">{fmt(stats?.resources?.totalDownloads)}</p>
              </div>
              <Download size={20} className="text-purple-600" />
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
              <div key={label} className={`p-3 bg-${color}-50 dark:bg-${color}-900/10 rounded-lg flex justify-between`}>
                <span className="font-semibold text-[var(--text-main)]">{label}</span>
                <span className={`font-bold text-${color}-600`}>{fmt(value)}</span>
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
                <tr><td colSpan={5} className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></td></tr>
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
                <tr><td colSpan={6} className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></td></tr>
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
          className: `text-${color}-500`,
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
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {React.createElement(Icon, { size: 16 })}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview"  && renderOverview()}
      {activeTab === "resources" && renderResources()}
      {activeTab === "content"   && renderContent()}
      {activeTab === "users"     && renderUsers()}

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
                className="flex-1 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-main)] rounded-xl hover:bg-[var(--bg-hover)] transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try { await confirmDelete.onConfirm(); } catch { toast.error("Delete failed"); }
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
