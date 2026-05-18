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

  const canEmbedPreview = (resource) =>
    ["PDF", "IMAGE"].includes(resource?.fileType);

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
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Academic Resources
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 border border-transparent dark:border-slate-800">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />
            <select
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100"
            >
              <option value="all">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="downloads">Sort by Downloads</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100"
            >
              {order === "asc" ? "↑" : "↓"}
            </button>
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 animate-pulse border border-transparent dark:border-slate-800"
              >
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2 mb-6"></div>
                <div className="flex justify-between items-center">
                  <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-20"></div>
                  <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-8"></div>
                </div>
              </div>
            ))
          : resources.map((resource) => (
              <div
                key={resource._id}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-md hover:shadow-lg transition p-6 flex flex-col border border-transparent dark:border-slate-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <FileText size={24} />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-full">
                    {resource.fileType}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 line-clamp-1">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {resource.description}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-800 pt-4">
                    <span>{resource.department}</span>
                    <span>Sem {resource.semester}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewResource(resource)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition text-sm font-semibold"
                    >
                      <Eye size={16} />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(
                          resource._id,
                          resource.fileUrl,
                          resource.title
                        )
                      }
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {!loading && resources.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-transparent dark:border-slate-800">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            No resources found
          </h3>
          <p className="text-gray-600 dark:text-slate-400">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-transparent dark:border-slate-800">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <FileText size={20} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white truncate max-w-md">
                  {previewResource.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition text-gray-500 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950 p-4">
              {canEmbedPreview(previewResource) ? (
                previewResource.fileType === "PDF" ? (
                  <iframe
                    src={`${previewResource.fileUrl}#toolbar=0`}
                    className="w-full h-[60vh] rounded-lg border dark:border-slate-800"
                    title={previewResource.title}
                  />
                ) : (
                  <img
                    src={previewResource.fileUrl}
                    alt={previewResource.title}
                    className="max-w-full mx-auto rounded-lg shadow-md"
                  />
                )
              ) : (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                  <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <ExternalLink size={48} className="text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    Preview not available
                  </h4>
                  <p className="text-gray-600 dark:text-slate-400 max-w-xs mb-6">
                    This file type ({previewResource.fileType}) cannot be
                    previewed in the browser.
                  </p>
                  <button
                    onClick={() =>
                      handleDownload(
                        previewResource._id,
                        previewResource.fileUrl,
                        previewResource.title
                      )
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md font-semibold flex items-center space-x-2"
                  >
                    <Download size={20} />
                    <span>Download to View</span>
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div className="text-sm text-gray-500 dark:text-slate-400">
                {previewResource.course} • {previewResource.department}
              </div>
              <button
                onClick={() =>
                  handleDownload(
                    previewResource._id,
                    previewResource.fileUrl,
                    previewResource.title
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
