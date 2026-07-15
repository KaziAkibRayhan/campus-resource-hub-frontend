// src/pages/Events.jsx
import React, { useState, useEffect, useCallback } from "react";
import useDebounce from "../hooks/useDebounce";
import {
  Calendar,
  CalendarDays,
  Users,
  MapPin,
  Clock,
  Plus,
  X,
  Check,
  HelpCircle,
  Ban,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { eventService, clubService } from "../services/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import useHighlight from "../hooks/useHighlight";

const PAGE_SIZE = 12;
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const Events = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const canManage = user?.role === "admin" || user?.role === "moderator";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useHighlight(!loading);
  const [view, setView] = useState("list"); // "list" | "calendar"
  const [scope, setScope] = useState("upcoming"); // upcoming | past | all
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [clubs, setClubs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const emptyForm = {
    title: "",
    description: "",
    clubRef: "",
    clubOther: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
  };
  const [form, setForm] = useState(emptyForm);

  const fetchList = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const params = { page: targetPage, limit: PAGE_SIZE, scope };
        if (debouncedSearch) params.search = debouncedSearch;
        const res = await eventService.getAll(params);
        const fetched = res.data.events || [];
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.currentPage || targetPage);
        setEvents((prev) => (append ? [...prev, ...fetched] : fetched));
      } catch (error) {
        console.error("Events fetch error:", error);
        toast.error(error.response?.data?.message || "Failed to fetch events");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [scope, debouncedSearch]
  );

  const fetchMonth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventService.getAll({
        from: startOfMonth(monthAnchor).toISOString(),
        to: endOfMonth(monthAnchor).toISOString(),
        limit: 200,
      });
      setEvents(res.data.events || []);
    } catch (error) {
      console.error("Events month fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [monthAnchor]);

  useEffect(() => {
    if (view === "calendar") fetchMonth();
    else fetchList(1, false);
  }, [view, fetchMonth, fetchList]);

  useEffect(() => {
    clubService
      .getAll({ limit: 100 })
      .then((res) => setClubs(res.data.clubs || []))
      .catch(() => {});
  }, []);

  // Realtime updates
  useEffect(() => {
    if (!socket) return;
    const patch = (payload) => {
      const id = payload.eventId || payload._id;
      setEvents((prev) =>
        prev.map((e) => (e._id === id ? { ...e, ...payload, _id: e._id } : e))
      );
    };
    const refresh = () => (view === "calendar" ? fetchMonth() : fetchList(1, false));
    const remove = ({ _id }) =>
      setEvents((prev) => prev.filter((e) => e._id !== _id));

    socket.on("event:updated", patch);
    socket.on("event:new", refresh);
    socket.on("event:deleted", remove);
    return () => {
      socket.off("event:updated", patch);
      socket.off("event:new", refresh);
      socket.off("event:deleted", remove);
    };
  }, [socket, view, fetchMonth, fetchList]);

  const updateEventLocal = (id, patch) =>
    setEvents((prev) => prev.map((e) => (e._id === id ? { ...e, ...patch } : e)));

  const handleRsvp = async (event, status) => {
    if (!user) return toast.error("Please log in to RSVP");
    try {
      setBusyId(event._id);
      const res = await eventService.rsvp(event._id, status);
      updateEventLocal(event._id, {
        myStatus: res.data.myStatus,
        goingCount: res.data.goingCount,
        maybeCount: res.data.maybeCount,
        registrationCount: res.data.goingCount,
        isRegistered: res.data.myStatus === "going",
        spotsLeft: res.data.spotsLeft,
        isFull: res.data.spotsLeft === 0,
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to RSVP");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (event) => {
    try {
      setBusyId(event._id);
      await eventService.cancel(event._id);
      updateEventLocal(event._id, { status: "cancelled" });
      toast.success("Event cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      setBusyId(event._id);
      await eventService.delete(event._id);
      setEvents((prev) => prev.filter((e) => e._id !== event._id));
      toast.success("Event deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (submitEvent) => {
    submitEvent.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        location: form.location,
        capacity: form.capacity || 0,
      };
      if (form.clubRef && form.clubRef !== "__other__") {
        payload.clubRef = form.clubRef;
        payload.club = clubs.find((c) => c._id === form.clubRef)?.name || "";
      } else {
        payload.club = form.clubOther;
      }
      await eventService.create(payload);
      toast.success("Event created");
      setForm(emptyForm);
      setShowCreate(false);
      view === "calendar" ? fetchMonth() : fetchList(1, false);
    } catch (error) {
      const data = error.response?.data;
      toast.error(
        data?.code === "CONTENT_REJECTED" ? data.message : data?.message || "Failed to create event"
      );
    }
  };

  const isOwner = (event) => user && event.postedBy?._id === user._id;

  // Filter for calendar's selected-day list
  const visibleEvents =
    view === "calendar" && selectedDay
      ? events.filter((e) => sameDay(new Date(e.date), selectedDay))
      : events;

  const renderRsvp = (event) => {
    if (event.status === "cancelled") {
      return (
        <div className="w-full text-center py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold text-sm">
          Cancelled
        </div>
      );
    }
    const my = event.myStatus;
    const fullForMe = event.isFull && my !== "going";
    const btn = (status, label, Icon, activeCls) => (
      <button
        key={status}
        disabled={busyId === event._id || (status === "going" && fullForMe)}
        onClick={() => handleRsvp(event, my === status ? "declined" : status)}
        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
          my === status
            ? activeCls
            : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
        }`}
      >
        <Icon size={15} />
        {label}
      </button>
    );
    return (
      <div className="flex gap-2">
        {btn(
          "going",
          fullForMe ? "Full" : "Going",
          Check,
          "bg-purple-600 text-white"
        )}
        {btn("maybe", "Maybe", HelpCircle, "bg-amber-500 text-white")}
      </div>
    );
  };

  const renderCard = (event) => (
    <div
      id={`hl-${event._id}`}
      key={event._id}
      className={`bg-[var(--bg-card)] rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border ${
        event.status === "cancelled"
          ? "border-red-300 dark:border-red-900/50 opacity-80"
          : "border-[var(--border-color)]"
      }`}
    >
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-28 flex items-center justify-center relative">
        <Calendar size={44} className="text-white" />
        <div className="absolute top-3 right-3 flex gap-1">
          {event.capacity > 0 && (
            <span className="bg-white/90 dark:bg-slate-900/90 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
              {event.isFull ? "Full" : `${event.spotsLeft} left`}
            </span>
          )}
        </div>
        {!event.approved && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
            Pending
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">{event.title}</h3>
        <p className="text-[var(--text-muted)] mb-4 text-sm line-clamp-3">{event.description}</p>

        <div className="space-y-2 text-sm text-[var(--text-muted)] mb-4">
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-purple-500" />
            <span>{event.clubRef?.name || event.club}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-purple-500" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-purple-500" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin size={16} className="text-purple-500" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-purple-500" />
            <span>
              {event.goingCount || 0} going
              {event.maybeCount ? ` · ${event.maybeCount} maybe` : ""}
            </span>
          </div>
        </div>

        {renderRsvp(event)}

        {(isOwner(event) || canManage) && event.status !== "cancelled" && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleCancel(event)}
              disabled={busyId === event._id}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] disabled:opacity-50"
            >
              <Ban size={13} /> Cancel
            </button>
            <button
              onClick={() => handleDelete(event)}
              disabled={busyId === event._id}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 disabled:opacity-50"
            >
              <X size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Calendar grid ───────────────────────────────────────────────
  const renderCalendar = () => {
    const first = startOfMonth(monthAnchor);
    const startWeekday = first.getDay();
    const daysInMonth = endOfMonth(monthAnchor).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      cells.push(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), d));

    const eventsByDay = {};
    events.forEach((e) => {
      const key = new Date(e.date).getDate();
      (eventsByDay[key] = eventsByDay[key] || []).push(e);
    });

    return (
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSelectedDay(null);
              setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1));
            }}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)]"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-bold text-[var(--text-main)]">
            {monthAnchor.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </h3>
          <button
            onClick={() => {
              setSelectedDay(null);
              setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1));
            }}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)]"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--text-muted)] mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} />;
            const dayEvents = eventsByDay[cell.getDate()] || [];
            const isToday = sameDay(cell, new Date());
            const isSelected = selectedDay && sameDay(cell, selectedDay);
            return (
              <button
                key={cell.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : cell)}
                className={`min-h-[60px] rounded-lg p-1.5 text-left border transition ${
                  isSelected
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isToday ? "text-purple-600" : "text-[var(--text-main)]"
                  }`}
                >
                  {cell.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e._id}
                        className="text-[10px] truncate px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-[var(--text-muted)]">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Events</h2>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Don't miss out on exciting campus events
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-md"
          >
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 border border-[var(--border-color)] flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              view === "list" ? "bg-purple-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <List size={16} /> List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              view === "calendar" ? "bg-purple-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <CalendarDays size={16} /> Calendar
          </button>
        </div>

        {view === "list" && (
          <div className="flex flex-wrap gap-2 items-center">
            {["upcoming", "past", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  scope === s ? "bg-blue-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {s}
              </button>
            ))}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="px-4 py-2 rounded-lg w-full sm:w-56"
            />
          </div>
        )}
      </div>

      {view === "calendar" && renderCalendar()}

      {/* Events */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-12 text-center border border-[var(--border-color)]">
          <Calendar className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" size={64} />
          <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No events found</h3>
          <p className="text-[var(--text-muted)]">
            {view === "calendar" && selectedDay
              ? "No events on this day."
              : "Check back later for new events!"}
          </p>
        </div>
      ) : (
        <>
          {view === "calendar" && selectedDay && (
            <h3 className="font-semibold text-[var(--text-main)]">
              {selectedDay.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleEvents.map(renderCard)}
          </div>
          {view === "list" && page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchList(page + 1, true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)]"
          >
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[var(--text-main)]">Create Event</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] transition"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="w-full px-4 py-3"
                required
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows="3"
                className="w-full px-4 py-3"
                required
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <select
                    value={form.clubRef}
                    onChange={(e) => setForm({ ...form, clubRef: e.target.value })}
                    className="w-full px-4 py-3"
                    required
                  >
                    <option value="">Select club…</option>
                    {clubs.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__other__">Other (type name)</option>
                  </select>
                  {form.clubRef === "__other__" && (
                    <input
                      value={form.clubOther}
                      onChange={(e) => setForm({ ...form, clubOther: e.target.value })}
                      placeholder="Club name"
                      className="w-full px-4 py-3 mt-2"
                      required
                    />
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="Capacity (0 = unlimited)"
                  className="w-full px-4 py-3"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3"
                  required
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full px-4 py-3"
                  required
                />
              </div>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location"
                className="w-full px-4 py-3"
                required
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 shadow-lg transition"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-main)] py-3 rounded-lg font-bold hover:bg-[var(--bg-hover)] transition border border-[var(--border-color)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Events;
