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
import { resourceService } from "../services/api";
import { toast } from "sonner";

const AdminPanel = () => {
  const [pendingResources, setPendingResources] = useState([]);
  const [totalResources, setTotalResources] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingResources();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await resourceService.getAll({ limit: 1 });
      setTotalResources(response.data.total);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPendingResources = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getAll({ isPending: true });
      setPendingResources(response.data.resources);
    } catch (error) {
      toast.error("Failed to fetch pending resources");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await resourceService.approve(id);
      toast.success("Resource approved");
      fetchPendingResources();
    } catch (error) {
      toast.error("Failed to approve resource");
    }
  };

  const handleReject = async (id) => {
    try {
      await resourceService.reject(id);
      toast.success("Resource rejected");
      fetchPendingResources();
    } catch (error) {
      toast.error("Failed to reject resource");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Admin Panel</h2>
        <p className="text-gray-600 mt-1">Manage platform content and users</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Pending Approvals
            </h3>
            <FileText className="text-yellow-500" size={24} />
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-gray-800">3 Resources</p>
              <p className="text-sm text-gray-600">Awaiting review</p>
            </div>
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-gray-800">2 Announcements</p>
              <p className="text-sm text-gray-600">Awaiting review</p>
            </div>
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-gray-800">1 Lost Item</p>
              <p className="text-sm text-gray-600">Awaiting review</p>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">User Management</h3>
            <Users className="text-blue-500" size={24} />
          </div>
          <div className="space-y-3">
            <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition">
              <p className="font-semibold text-gray-800">All Users</p>
              <p className="text-sm text-gray-600">1,234 registered</p>
            </button>
            <button className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition">
              <p className="font-semibold text-gray-800">Moderators</p>
              <p className="text-sm text-gray-600">15 active</p>
            </button>
            <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition">
              <p className="font-semibold text-gray-800">Blocked Users</p>
              <p className="text-sm text-gray-600">3 blocked</p>
            </button>
          </div>
        </div>

        {/* System Reports */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">System Status</h3>
            <HardDrive className="text-green-500" size={24} />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-gray-800">Storage Used</p>
                <p className="text-sm text-gray-600">6.5 GB / 10 GB</p>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "65%" }}
                ></div>
              </div>
            </div>
            <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Download Reports</p>
                <p className="text-sm text-gray-600">Export system data</p>
              </div>
              <Download size={20} className="text-purple-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Resources Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Pending Resources</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Resource
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Uploader
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Date
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                    No pending resources to review
                  </td>
                </tr>
              ) : (
                pendingResources.map((resource) => (
                  <tr key={resource._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">
                        {resource.title}
                      </p>
                      <p className="text-sm text-gray-500">{resource.course}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {resource.uploadedBy?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(resource._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Approve"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleReject(resource._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium mb-1">
            Total Resources
          </p>
          <p className="text-3xl font-bold text-blue-700">{totalResources}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium mb-1">
            Active Users
          </p>
          <p className="text-3xl font-bold text-green-700">856</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-purple-600 text-sm font-medium mb-1">
            Total Downloads
          </p>
          <p className="text-3xl font-bold text-purple-700">45.2K</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-600 text-sm font-medium mb-1">
            Active Clubs
          </p>
          <p className="text-3xl font-bold text-orange-700">24</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
