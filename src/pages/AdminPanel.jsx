// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Users,
  FileText,
  HardDrive,
  Download,
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

const AdminPanel = () => {
  const { user } = useAuth();
  const [pendingResources, setPendingResources] = useState([]);
  const [pendingAnnouncements, setPendingAnnouncements] = useState([]);
  const [pendingLostFound, setPendingLostFound] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatNumber = (value = 0) => Intl.NumberFormat().format(value);
  const formatBytes = (bytes = 0) => {
    if (!bytes) return "0 MB";
    const units = ["B", "KB", "MB", "GB"];
    const unitIndex = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${
      units[unitIndex]
    }`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPending, annPending, eventPending, lostPending, usersResponse, statsResponse] = await Promise.all([
        resourceService.getAll({ isPending: true }),
        announcementService.getAll({ approved: false }),
        eventService.getAll({ approved: false }),
        lostFoundService.getAll({ approved: false }),
        adminService.getUsers(),
        adminService.getStats(),
      ]);

      setPendingResources(resPending.data.resources);
      setPendingAnnouncements(annPending.data.announcements);
      setPendingEvents(eventPending.data.events);
      setPendingLostFound(lostPending.data.items);
      setUsers(usersResponse.data.users);
      setStats(statsResponse.data.stats);
    } catch (error) {
      console.error("Admin dashboard fetch error:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await resourceService.approve(id);
      toast.success("Resource approved");
      fetchData();
    } catch (error) {
      console.error("Approve resource error:", error);
      toast.error("Failed to approve resource");
    }
  };

  const handleReject = async (id) => {
    try {
      const reason = window.prompt("Reason for rejection?");
      if (reason === null) return;
      await resourceService.reject(id, reason);
      toast.success("Resource rejected");
      fetchData();
    } catch (error) {
      console.error("Reject resource error:", error);
      toast.error("Failed to reject resource");
    }
  };

  const handleApproveContent = async (service, id, label) => {
    try {
      await service.approve(id);
      toast.success(`${label} approved`);
      fetchData();
    } catch (error) {
      console.error(`${label} approve error:`, error);
      toast.error(`Failed to approve ${label.toLowerCase()}`);
    }
  };

  const handleRejectContent = async (service, id, label) => {
    try {
      const reason = window.prompt(`Reason for rejecting this ${label.toLowerCase()}?`);
      if (reason === null) return;
      await service.reject(id, reason);
      toast.success(`${label} rejected`);
      fetchData();
    } catch (error) {
      console.error(`${label} reject error:`, error);
      toast.error(`Failed to reject ${label.toLowerCase()}`);
    }
  };

  const handleUserBlocked = async (targetUser) => {
    try {
      await adminService.setUserBlocked(targetUser._id, !targetUser.isBlocked);
      toast.success(targetUser.isBlocked ? "User unblocked" : "User blocked");
      fetchData();
    } catch (error) {
      console.error("User block update error:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleRoleChange = async (targetUser, role) => {
    try {
      await adminService.updateUserRole(targetUser._id, role);
      toast.success("User role updated");
      fetchData();
    } catch (error) {
      console.error("User role update error:", error);
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Panel</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Manage platform content and users</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              Pending Approvals
            </h3>
            <FileText className="text-yellow-500" size={24} />
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-[var(--text-main)]">
                {pendingResources.length} Resources
              </p>
              <p className="text-sm text-[var(--text-muted)]">Awaiting review</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-[var(--text-main)]">
                {pendingAnnouncements.length} Announcements
              </p>
              <p className="text-sm text-[var(--text-muted)]">Awaiting review</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-[var(--text-main)]">
                {pendingEvents.length} Events
              </p>
              <p className="text-sm text-[var(--text-muted)]">Awaiting review</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-[var(--text-main)]">
                {pendingLostFound.length} Lost & Found
              </p>
              <p className="text-sm text-[var(--text-muted)]">Awaiting review</p>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--text-main)]">User Management</h3>
            <Users className="text-blue-500" size={24} />
          </div>
          <div className="space-y-3">
            <button className="w-full p-3 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg text-left transition">
              <p className="font-semibold text-[var(--text-main)]">All Users</p>
              <p className="text-sm text-[var(--text-muted)]">
                {formatNumber(stats?.users?.total)} registered
              </p>
            </button>
            <button className="w-full p-3 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg text-left transition">
              <p className="font-semibold text-[var(--text-main)]">Moderators</p>
              <p className="text-sm text-[var(--text-muted)]">
                {formatNumber(stats?.users?.moderators)} active
              </p>
            </button>
            <button className="w-full p-3 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg text-left transition">
              <p className="font-semibold text-[var(--text-main)]">Blocked Users</p>
              <p className="text-sm text-[var(--text-muted)]">
                {formatNumber(stats?.users?.blocked)} blocked
              </p>
            </button>
          </div>
        </div>

        {/* System Reports */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--text-main)]">System Status</h3>
            <HardDrive className="text-green-500" size="24" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-[var(--text-main)]">Storage Used</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {formatBytes(stats?.resources?.storageUsed)}
                </p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats?.resources?.storageUsed ? 65 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="w-full p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--text-main)]">Approved Resources</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {formatNumber(stats?.resources?.approved)} visible
                </p>
              </div>
              <Download size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {[
          {
            title: "Pending Announcements",
            items: pendingAnnouncements,
            service: announcementService,
            label: "Announcement",
            primary: "title",
            secondary: "department",
          },
          {
            title: "Pending Events",
            items: pendingEvents,
            service: eventService,
            label: "Event",
            primary: "title",
            secondary: "club",
          },
          {
            title: "Pending Lost & Found",
            items: pendingLostFound,
            service: lostFoundService,
            label: "Lost & Found item",
            primary: "item",
            secondary: "type",
          },
        ].map((section) => (
          <div key={section.title} className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border border-transparent dark:border-slate-800">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">{section.title}</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <div className="p-6 text-center text-gray-500 dark:text-slate-400">Loading...</div>
              ) : section.items.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-slate-400">Nothing pending</div>
              ) : (
                section.items.slice(0, 5).map((item) => (
                  <div key={item._id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">
                        {item[section.primary]}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400 capitalize">
                        {item[section.secondary]}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleApproveContent(section.service, item._id, section.label)
                        }
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                        title="Approve"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleRejectContent(section.service, item._id, section.label)
                        }
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pending Resources Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border border-transparent dark:border-slate-800">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Pending Resources</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-left">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300">
                  Resource
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300">
                  Uploader
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300">
                  Date
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : pendingResources.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                    No pending resources to review
                  </td>
                </tr>
              ) : (
                pendingResources.map((resource) => (
                  <tr key={resource._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 dark:text-slate-200">
                        {resource.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{resource.course}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {resource.uploadedBy?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(resource._id)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                          title="Approve"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleReject(resource._id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Reject"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors shadow-sm">
          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
            Total Resources
          </p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
            {formatNumber(stats?.resources?.total)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors shadow-sm">
          <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">
            Active Users
          </p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">
            {formatNumber(stats?.users?.active)}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 transition-colors shadow-sm">
          <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">
            Total Downloads
          </p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {formatNumber(stats?.resources?.totalDownloads)}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 transition-colors shadow-sm">
          <p className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">
            Active Clubs
          </p>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {formatNumber(stats?.clubs?.total)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border border-transparent dark:border-slate-800">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">User Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-left">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300">User</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300">Role</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {users.slice(0, 10).map((targetUser) => (
                <tr key={targetUser._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800 dark:text-slate-200">{targetUser.name}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{targetUser.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{targetUser.department}</td>
                  <td className="px-6 py-4">
                    {user?.role === "admin" ? (
                      <select
                        value={targetUser.role}
                        onChange={(event) =>
                          handleRoleChange(targetUser, event.target.value)
                        }
                        className="px-3 py-2 text-sm"
                      >
                        <option value="student">student</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className="text-gray-600 dark:text-slate-300">{targetUser.role}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        targetUser.isBlocked
                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      }`}
                    >
                      {targetUser.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleUserBlocked(targetUser)}
                      className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm transition"
                    >
                      {targetUser.isBlocked ? "Unblock" : "Block"}
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
};

export default AdminPanel;
