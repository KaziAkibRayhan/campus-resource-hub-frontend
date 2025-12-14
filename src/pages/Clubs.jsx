// src/pages/Clubs.jsx
import React from "react";
import { Users, FileText } from "lucide-react";
import { dummyClubs } from "../utils/dummyData";

const Clubs = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Campus Clubs</h2>
        <p className="text-gray-600 mt-1">
          Explore and join student organizations
        </p>
      </div>

      {/* Clubs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dummyClubs.map((club) => (
          <div
            key={club.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
          >
            {/* Club Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition">
              <Users size={32} className="text-white" />
            </div>

            {/* Club Info */}
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              {club.name}
            </h3>
            <p className="text-gray-600 text-center text-sm mb-4 h-12">
              {club.description}
            </p>

            {/* Stats */}
            <div className="flex justify-around text-center pt-4 border-t border-gray-200">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {club.members}
                </p>
                <p className="text-xs text-gray-500">Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {club.posts}
                </p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
            </div>

            {/* Action Button */}
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
              View Club
            </button>
          </div>
        ))}
      </div>

      {/* Featured Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">
              Want to start your own club?
            </h3>
            <p className="text-blue-100">
              We encourage students to create new organizations. Submit your
              proposal to the student affairs office.
            </p>
          </div>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold whitespace-nowrap">
            Submit Proposal
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clubs;
