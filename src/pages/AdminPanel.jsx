// src/pages/AdminPanel.jsx
import React from "react";
import {
  CheckCircle,
  XCircle,
  Users,
  FileText,
  HardDrive,
  Download,
} from "lucide-react";

const AdminPanel = () => {
  const pendingResources = [
    {
      id: 1,
      title: "Machine Learning Notes",
      uploader: "John Doe",
      date: "2024-12-14",
    },
    {
      id: 2,
      title: "Network Security Slides",
      uploader: "Jane Smith",
      date: "2024-12-13",
    },
    {
      id: 3,
      title: "Web Development Guide",
      uploader: "Mike Johnson",
      date: "2024-12-13",
    },
  ];

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
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Pending Resource Approvals
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                  Uploader
                </th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                  Date
                </th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingResources.map((resource) => (
                <tr
                  key={resource.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">
                      {resource.title}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {resource.uploader}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{resource.date}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end space-x-2">
                      <button className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition flex items-center space-x-1">
                        <CheckCircle size={16} />
                        <span>Approve</span>
                      </button>
                      <button className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition flex items-center space-x-1">
                        <XCircle size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
          <p className="text-3xl font-bold text-blue-700">1,234</p>
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
