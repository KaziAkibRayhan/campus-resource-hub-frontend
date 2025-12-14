// src/pages/Announcements.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Plus } from "lucide-react";
import { dummyAnnouncements } from "../utils/dummyData";

const Announcements = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Announcements</h2>
          <p className="text-gray-600 mt-1">Stay updated with campus news</p>
        </div>
        {(user.role === "admin" || user.role === "moderator") && (
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2">
            <Plus size={20} />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {dummyAnnouncements.map((announcement) => (
          <div
            key={announcement.id}
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
                    <span>Posted by {announcement.postedBy}</span>
                    <span>•</span>
                    <span>{announcement.date}</span>
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
    </div>
  );
};

export default Announcements;
