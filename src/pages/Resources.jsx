// src/pages/Resources.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Upload,
  Filter,
  Download,
  Eye,
  Star,
  FileText,
} from "lucide-react";
import { dummyResources, departments, semesters } from "../utils/dummyData";

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");

  const filteredResources = dummyResources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      selectedDepartment === "all" ||
      resource.department === selectedDepartment;
    const matchesSem =
      selectedSemester === "all" || resource.semester === selectedSemester;
    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Academic Resources
          </h2>
          <p className="text-gray-600 mt-1">
            Browse and download study materials
          </p>
        </div>
        <Link
          to="/upload-resource"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition shadow-md"
        >
          <Upload size={20} />
          <span>Upload Resource</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <select
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Semester Filter */}
          <select
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem} Semester
              </option>
            ))}
          </select>

          {/* More Filters Button */}
          <button className="bg-gray-100 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-200 transition">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing{" "}
          <span className="font-semibold">{filteredResources.length}</span>{" "}
          resources
        </p>
        <select className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          <option>Sort by: Latest</option>
          <option>Sort by: Most Downloaded</option>
          <option>Sort by: Highest Rated</option>
        </select>
      </div>

      {/* Resources List */}
      <div className="space-y-4">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="bg-white border rounded-xl p-6 hover:shadow-lg transition"
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              {/* Resource Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="text-red-500" size={28} />
                  <h3 className="text-lg font-bold text-gray-800">
                    {resource.title}
                  </h3>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {resource.course}
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {resource.department}
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {resource.semester}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {resource.type}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>
                    Uploaded by{" "}
                    <span className="font-medium text-gray-700">
                      {resource.uploadedBy}
                    </span>
                  </span>
                  <span>•</span>
                  <span>{resource.date}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Star
                      size={16}
                      className="text-yellow-500 fill-yellow-500"
                    />
                    <span className="font-medium text-gray-700">
                      {resource.rating}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Download size={16} />
                    <span className="font-medium text-gray-700">
                      {resource.downloads}
                    </span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center space-x-2">
                  <Eye size={18} />
                  <span>Preview</span>
                </button>
                <button className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition flex items-center justify-center space-x-2">
                  <Download size={18} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No resources found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDepartment("all");
              setSelectedSemester("all");
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Resources;
