// src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Bell,
  Calendar,
  AlertCircle,
  Download,
  TrendingUp,
} from "lucide-react";
import { dummyResources, dummyAnnouncements } from "../utils/dummyData";

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "Total Resources",
      value: "1,234",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/resources",
    },
    {
      title: "Announcements",
      value: "45",
      icon: Bell,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      link: "/announcements",
    },
    {
      title: "Upcoming Events",
      value: "12",
      icon: Calendar,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      link: "/events",
    },
    {
      title: "Lost Items",
      value: "8",
      icon: AlertCircle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      link: "/lost-found",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h2>
        <p className="text-blue-100">
          Here's what's happening in your campus today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={stat.textColor} size={24} />
              </div>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent Resources & Announcements */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Resources */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Recent Resources
            </h3>
            <Link
              to="/resources"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {dummyResources.slice(0, 4).map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">
                    {resource.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {resource.course} • {resource.department}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Download size={16} />
                  <span>{resource.downloads}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Latest Announcements
            </h3>
            <Link
              to="/announcements"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {dummyAnnouncements.slice(0, 4).map((announcement) => (
              <div
                key={announcement.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Bell size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {announcement.department} • {announcement.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/upload-resource"
            className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
          >
            <BookOpen className="text-blue-600 mb-2" size={32} />
            <span className="text-sm font-semibold text-gray-800">
              Upload Resource
            </span>
          </Link>
          <Link
            to="/events"
            className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-center"
          >
            <Calendar className="text-purple-600 mb-2" size={32} />
            <span className="text-sm font-semibold text-gray-800">
              View Events
            </span>
          </Link>
          <Link
            to="/lost-found"
            className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition text-center"
          >
            <AlertCircle className="text-orange-600 mb-2" size={32} />
            <span className="text-sm font-semibold text-gray-800">
              Report Item
            </span>
          </Link>
          <Link
            to="/clubs"
            className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition text-center"
          >
            <BookOpen className="text-green-600 mb-2" size={32} />
            <span className="text-sm font-semibold text-gray-800">
              Explore Clubs
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
