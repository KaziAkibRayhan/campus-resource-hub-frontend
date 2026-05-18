// src/pages/Events.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Users, MapPin, Clock, Plus, X } from "lucide-react";
import { eventService } from "../services/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    club: "",
    date: "",
    time: "",
    location: "",
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventService.getAll();
      setEvents(response.data.events);
    } catch (error) {
      console.error("Events fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRegister = async (eventId) => {
    try {
      await eventService.register(eventId);
      toast.success("Registered for event");
      fetchEvents();
    } catch (error) {
      console.error("Event registration error:", error);
      toast.error(error.response?.data?.message || "Failed to register");
    }
  };

  const handleCreate = async (submitEvent) => {
    submitEvent.preventDefault();
    try {
      await eventService.create(form);
      toast.success("Event created");
      setForm({
        title: "",
        description: "",
        club: "",
        date: "",
        time: "",
        location: "",
      });
      setShowCreate(false);
      fetchEvents();
    } catch (error) {
      console.error("Event create error:", error);
      toast.error(error.response?.data?.message || "Failed to create event");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Upcoming Events</h2>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Don't miss out on exciting campus events
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "moderator") && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-md"
          >
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-[var(--bg-card)] rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-[var(--border-color)]"
            >
              {/* Event Header with Gradient */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-32 flex items-center justify-center relative">
                <Calendar size={48} className="text-white" />
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
                  Upcoming
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">
                  {event.title}
                </h3>
                <p className="text-[var(--text-muted)] mb-4 text-sm">{event.description}</p>

                <div className="space-y-2 text-sm text-[var(--text-muted)] mb-4">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-purple-500" />
                    <span>{event.club}</span>
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
                    <span>{event.registrationCount || 0} registered</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRegister(event._id)}
                  disabled={event.isRegistered}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-[var(--bg-secondary)] disabled:text-[var(--text-muted)] shadow-md"
                >
                  {event.isRegistered ? "Registered" : "Register Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-12 text-center border border-[var(--border-color)]">
          <Calendar className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" size={64} />
          <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No events found</h3>
          <p className="text-[var(--text-muted)]">Check back later for new events!</p>
        </div>
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
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Title"
                className="w-full px-4 py-3"
                required
              />
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Description"
                rows="3"
                className="w-full px-4 py-3"
                required
              />
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={form.club}
                  onChange={(event) => setForm({ ...form, club: event.target.value })}
                  placeholder="Club Name"
                  className="w-full px-4 py-3"
                  required
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="w-full px-4 py-3"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                  className="w-full px-4 py-3"
                  required
                />
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                  placeholder="Location"
                  className="w-full px-4 py-3"
                  required
                />
              </div>
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
