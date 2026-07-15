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
  Sunrise,
  Sun,
  Moon,
} from "lucide-react";
import {
  announcementService,
  clubService,
  eventService,
  lostFoundService,
  resourceService,
} from "../services/api";
import { toast } from "sonner";
import { SkeletonGrid, SkeletonRow } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";

// Time-of-day greeting: morning (<12), afternoon (<17), evening.
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", Icon: Sunrise };
  if (hour < 17) return { text: "Good afternoon", Icon: Sun };
  return { text: "Good evening", Icon: Moon };
};

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

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || "there";
  const todayLine = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const stats = [
    {
      title: "Total Resources",
      value: counts.resources,
      icon: BookOpen,
      chip: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
      link: "/resources",
    },
    {
      title: "Announcements",
      value: counts.announcements,
      icon: Bell,
      chip: "bg-green-500/10 text-green-500 border border-green-500/20",
      link: "/announcements",
    },
    {
      title: "Upcoming Events",
      value: counts.events,
      icon: Calendar,
      chip: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
      link: "/events",
    },
    {
      title: "Lost Items",
      value: counts.lostFound,
      icon: AlertCircle,
      chip: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
      link: "/lost-found",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <greeting.Icon size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">
            {greeting.text}, {firstName}
          </h2>
          <p className="text-[var(--text-muted)] mt-1">
            {todayLine} — here's what's happening on campus
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <SkeletonGrid
          count={4}
          lines={1}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 group border border-[var(--border-color)] transition hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.chip}`}
                >
                  <stat.icon size={22} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-[var(--text-main)]">
                {stat.value}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Resources & Announcements */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Resources */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <BookOpen size={18} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                Recent Resources
              </h3>
            </div>
            <Link
              to="/resources"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          {loading ? (
            <SkeletonRow count={4} />
          ) : resources.length === 0 ? (
            <EmptyState
              compact
              icon={BookOpen}
              title="No recent resources"
              hint="Uploaded study materials will show up here."
            />
          ) : (
            <div className="space-y-3">
              {resources.slice(0, 4).map((resource) => (
                <div
                  key={resource._id}
                  className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-main)] rounded-lg hover:bg-[var(--bg-hover)] transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-main)] text-sm truncate">
                      {resource.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {resource.course && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {resource.course}
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)] truncate">
                        {resource.department}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-[var(--text-muted)] flex-shrink-0">
                    <Download size={16} />
                    <span>{resource.downloads}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Announcements */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
                <Bell size={18} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                Latest Announcements
              </h3>
            </div>
            <Link
              to="/announcements"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          {loading ? (
            <SkeletonRow count={4} />
          ) : announcements.length === 0 ? (
            <EmptyState
              compact
              icon={Bell}
              title="No recent announcements"
              hint="Campus announcements will show up here."
            />
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 4).map((announcement) => (
                <div
                  key={announcement._id}
                  className="p-3 bg-[var(--bg-main)] rounded-lg hover:bg-[var(--bg-hover)] transition"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-main)] text-sm truncate">
                        {announcement.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                          {announcement.department}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-color)]">
        <h3 className="text-xl font-bold text-[var(--text-main)] mb-4">
          Quick Actions
        </h3>
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
