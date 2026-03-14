// src/pages/Announcements.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Plus } from "lucide-react";
import { announcementService } from "../services/api";
import { toast } from "sonner";

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Announcements</h2>
          <p className="text-gray-600 mt-1">Stay updated with campus news</p>
        </div>
        {(user?.role === "admin" || user?.role === "moderator") && (
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2">
            <Plus size={20} />
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
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                    <Bell className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {announcement.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {announcement.department}
                      </span>
                      <span>Posted by {announcement.postedBy?.name || "Admin"}</span>
                      <span>•</span>
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {announcement.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && announcements.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Bell className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No announcements found</h3>
          <p className="text-gray-600">Stay tuned for updates!</p>
        </div>
      )}
    </div>
  );
};

export default Announcements;
