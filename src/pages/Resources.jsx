// src/pages/Resources.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Upload,
  Filter,
  Download,
  Eye,
  Star,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";
import { departments, semesters } from "../utils/constants";
import { resourceService } from "../services/api";
import { toast } from "sonner";

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [previewResource, setPreviewResource] = useState(null);

  const getPreviewUrl = (resource) => {
    if (!resource?.fileUrl) return "";
    const encodedUrl = encodeURIComponent(resource.fileUrl);

    if (["PDF", "DOCX", "PPTX", "XLSX"].includes(resource.fileType)) {
      return `https://docs.google.com/gview?embedded=1&url=${encodedUrl}`;
    }

    return resource.fileUrl;
  };

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedDepartment !== "all") params.department = selectedDepartment;
      if (selectedSemester !== "all") params.semester = selectedSemester;
      params.sortBy = sortBy;
      params.order = order;

      const response = await resourceService.getAll(params);
      setResources(response.data.resources);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDepartment, selectedSemester, sortBy, order]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDownload = async (id, fileUrl, fileName) => {
    try {
      await resourceService.incrementDownload(id);

      // Fetch the file as a blob to trigger download
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "resource-file");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error downloading file");
    }
  };

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
          <span className="font-semibold">{resources.length}</span>{" "}
          resources
        </p>
        <select
          className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          value={`${sortBy}:${order}`}
          onChange={(event) => {
            const [nextSortBy, nextOrder] = event.target.value.split(":");
            setSortBy(nextSortBy);
            setOrder(nextOrder);
          }}
        >
          <option value="createdAt:desc">Sort by: Latest</option>
          <option value="downloads:desc">Sort by: Most Downloaded</option>
          <option value="rating:desc">Sort by: Highest Rated</option>
          <option value="title:asc">Sort by: Title A-Z</option>
        </select>
      </div>

      {/* Resources List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <div
              key={resource._id}
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
                      {resource.fileType}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>
                      Uploaded by{" "}
                      <span className="font-medium text-gray-700">
                        {resource.uploadedBy?.name || "Anonymous"}
                      </span>
                    </span>
                    <span>•</span>
                    <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
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
                  <button
                    onClick={() => setPreviewResource(resource)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center space-x-2"
                  >
                    <Eye size={18} />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDownload(resource._id, resource.fileUrl, resource.title)
                    }
                    className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition flex items-center justify-center space-x-2"
                  >
                    <Download size={18} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <FileText className="text-red-500" size={24} />
                <h3 className="text-lg font-bold text-gray-800 truncate max-w-md">
                  {previewResource.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-gray-100 relative">
              {previewResource.fileUrl ? (
                <iframe
                  src={getPreviewUrl(previewResource)}
                  className="w-full h-full border-none"
                  title={`${previewResource.title} preview`}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <div className="bg-blue-100 p-6 rounded-full">
                    <FileText size={64} className="text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-800">
                      Preview not available
                    </h4>
                    <p className="text-gray-600">
                      This file type ({previewResource.fileType}) cannot be
                      previewed directly.
                    </p>
                  </div>
                  <a
                    href={getPreviewUrl(previewResource)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                  >
                    <ExternalLink size={20} />
                    <span>Open Preview</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Uploaded by {previewResource.uploadedBy?.name}
              </div>
              <div className="flex gap-2">
                <a
                  href={getPreviewUrl(previewResource)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition flex items-center space-x-2"
                >
                  <ExternalLink size={20} />
                  <span>Open</span>
                </a>
                <button
                  onClick={() =>
                    handleDownload(
                      previewResource._id,
                      previewResource.fileUrl,
                      previewResource.title
                    )
                  }
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Download size={20} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && resources.length === 0 && (
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
