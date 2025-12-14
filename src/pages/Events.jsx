// src/pages/Events.jsx
import React from "react";
import { Calendar, Users, MapPin, Clock } from "lucide-react";
import { dummyEvents } from "../utils/dummyData";

const Events = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Upcoming Events</h2>
        <p className="text-gray-600 mt-1">
          Don't miss out on exciting campus events
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyEvents.map((event) => (
          <div
            key={event.id}
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
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-purple-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-purple-500" />
                  <span>{event.location}</span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold">
                Register Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar View Button */}
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Want to see more?
        </h3>
        <p className="text-gray-600 mb-4">View all events in calendar format</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Open Calendar View
        </button>
      </div>
    </div>
  );
};

export default Events;
