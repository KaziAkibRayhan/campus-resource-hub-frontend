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
          <h2 className="text-3xl font-bold text-gray-800">Upcoming Events</h2>
          <p className="text-gray-600 mt-1">
            Don't miss out on exciting campus events
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "moderator") && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
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
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {/* Event Header with Gradient */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-32 flex items-center justify-center relative">
                <Calendar size={48} className="text-white" />
                <div className="absolute top-4 right-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                  Upcoming
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">{event.description}</p>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-300 disabled:text-gray-600"
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
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No events found</h3>
          <p className="text-gray-600">Check back later for new events!</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Create Event</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Title"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Description"
                rows="3"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={form.club}
                  onChange={(event) => setForm({ ...form, club: event.target.value })}
                  placeholder="Club"
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                  placeholder="Location"
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                  className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Save Event
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
