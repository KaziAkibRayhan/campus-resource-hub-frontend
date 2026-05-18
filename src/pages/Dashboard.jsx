// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
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
import {
  announcementService,
  clubService,
  eventService,
  lostFoundService,
  resourceService,
} from "../services/api";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [counts, setCounts] = useState({
    resources: 0,
    announcements: 0,
    events: 0,
    lostFound: 0,
    clubs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          resResponse,
          annResponse,
          eventResponse,
          lostFoundResponse,
          clubResponse,
        ] = await Promise.all([
          resourceService.getAll({ limit: 4 }),
          announcementService.getAll({ limit: 4 }),
          eventService.getAll({ limit: 4 }),
          lostFoundService.getAll(),
          clubService.getAll(),
        ]);
        setResources(resResponse.data.resources);
        setAnnouncements(annResponse.data.announcements);
        setCounts({
          resources: resResponse.data.total || resResponse.data.count || 0,
          announcements: annResponse.data.count || 0,
          events: eventResponse.data.count || 0,
          lostFound: lostFoundResponse.data.count || 0,
          clubs: clubResponse.data.count || 0,
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Resources",
      value: counts.resources,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
      link: "/resources",
    },
    {
      title: "Announcements",
      value: counts.announcements,
      icon: Bell,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      link: "/announcements",
    },
    {
      title: "Upcoming Events",
      value: counts.events,
      icon: Calendar,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400",
      link: "/events",
    },
    {
      title: "Lost Items",
      value: counts.lostFound,
      icon: AlertCircle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
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
            className="bg-[var(--bg-card)] rounded-xl shadow-md hover:shadow-lg transition p-6 group border border-[var(--border-color)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg transition-colors`}>
                <stat.icon className={stat.textColor} size={24} />
              </div>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-[var(--text-main)]">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent Resources & Announcements */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Resources */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[var(--text-main)]">
              Recent Resources
            </h3>
            <Link
              to="/resources"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {resources.slice(0, 4).map((resource) => (
              <div
                key={resource._id}
                className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded-lg hover:bg-[var(--bg-hover)] transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-main)] text-sm">
                    {resource.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {resource.course} • {resource.department}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-[var(--text-muted)]">
                  <Download size={16} />
                  <span>{resource.downloads}</span>
                </div>
              </div>
            ))}
            {!loading && resources.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No recent resources</p>
            )}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[var(--text-main)]">
              Latest Announcements
            </h3>
            <Link
              to="/announcements"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.slice(0, 4).map((announcement) => (
              <div
                key={announcement._id}
                className="p-3 bg-[var(--bg-main)] rounded-lg hover:bg-[var(--bg-hover)] transition"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg flex-shrink-0">
                    <Bell size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-main)] text-sm truncate">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {announcement.department} • {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {!loading && announcements.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No recent announcements</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
        <h3 className="text-xl font-bold text-[var(--text-main)] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/upload-resource"
            className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-center"
          >
            <BookOpen className="text-blue-600 dark:text-blue-400 mb-2" size={32} />
            <span className="text-sm font-semibold text-[var(--text-main)]">
              Upload Resource
            </span>
          </Link>
          <Link
            to="/events"
            className="flex flex-col items-center justify-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-center"
          >
            <Calendar className="text-purple-600 dark:text-purple-400 mb-2" size={32} />
            <span className="text-sm font-semibold text-[var(--text-main)]">
              View Events
            </span>
          </Link>
          <Link
            to="/lost-found"
            className="flex flex-col items-center justify-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition text-center"
          >
            <AlertCircle className="text-orange-600 dark:text-orange-400 mb-2" size={32} />
            <span className="text-sm font-semibold text-[var(--text-main)]">
              Report Item
            </span>
          </Link>
          <Link
            to="/clubs"
            className="flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition text-center"
          >
            <BookOpen className="text-green-600 dark:text-green-400 mb-2" size={32} />
            <span className="text-sm font-semibold text-[var(--text-main)]">
              Explore Clubs ({counts.clubs})
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
