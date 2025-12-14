// src/pages/LostFound.jsx
import React, { useState } from "react";
import { AlertCircle, MapPin, Image, Plus } from "lucide-react";
import { dummyLostFound } from "../utils/dummyData";

const LostFound = () => {
  const [filter, setFilter] = useState("all"); // all, lost, found

  const filteredItems = dummyLostFound.filter(
    (item) => filter === "all" || item.type === filter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Lost & Found</h2>
          <p className="text-gray-600 mt-1">Help find or return lost items</p>
        </div>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition flex items-center space-x-2">
          <Plus size={20} />
          <span>Report Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter("lost")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "lost"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilter("found")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "found"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Found
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
          >
            {/* Header with Type Badge */}
            <div className="flex items-start justify-between mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  item.type === "lost"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {item.type.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">{item.date}</span>
            </div>

            {/* Item Content */}
            <div className="flex items-start space-x-4">
              {/* Image Placeholder */}
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.image ? (
                  <Image className="text-gray-400" size={32} />
                ) : (
                  <AlertCircle className="text-gray-400" size={32} />
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {item.item}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin size={16} className="text-orange-500" />
                    <span>
                      <span className="font-medium">Location:</span>{" "}
                      {item.location}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Contact:</span> {item.contact}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button className="mt-4 w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition font-medium">
              Contact Owner
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No items found
          </h3>
          <p className="text-gray-600">
            There are no {filter} items at the moment
          </p>
        </div>
      )}
    </div>
  );
};

export default LostFound;
