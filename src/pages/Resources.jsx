// src/pages/Resources.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Upload,
  Filter,
  Download,
  Eye,
  FileText,
  ChevronDown,
} from "lucide-react";
import { departments, semesters } from "../utils/constants";
import { resourceService } from "../services/api";
import { toast } from "sonner";
import ResourcePreview from "../components/resources/ResourcePreview";

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [previewResource, setPreviewResource] = useState(null);

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
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-[var(--border-color)]">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-[var(--text-muted)] pointer-events-none"
              size={20}
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-[var(--text-muted)] pointer-events-none"
              size={18}
            />
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="w-full pl-10 pr-4 py-2 appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-3 text-[var(--text-muted)] pointer-events-none"
              size={18}
            />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-[var(--text-muted)] pointer-events-none"
              size={18}
            />
            <select
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
              className="w-full pl-10 pr-4 py-2 appearance-none"
            >
              <option value="all">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-3 text-[var(--text-muted)] pointer-events-none"
              size={18}
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full px-4 py-2 pr-10 appearance-none"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="downloads">Sort by Downloads</option>
                <option value="title">Sort by Title</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-3 text-[var(--text-muted)] pointer-events-none"
                size={18}
              />
            </div>
            <button
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] transition shadow-sm"
            >
              {order === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[var(--text-muted)]">
          Showing{" "}
          <span className="font-semibold text-[var(--text-main)]">{resources.length}</span>{" "}
          resources
        </p>
        <div className="relative w-full sm:w-auto">
          <select
            className="w-full sm:w-auto px-4 py-2 pr-10 text-sm appearance-none"
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
          <ChevronDown
            className="absolute right-3 top-2.5 text-[var(--text-muted)] pointer-events-none"
            size={16}
          />
        </div>
      </div>

      {/* Resources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 animate-pulse border border-[var(--border-color)]"
              >
                <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/2 mb-6"></div>
                <div className="flex justify-between items-center">
                  <div className="h-8 bg-[var(--bg-secondary)] rounded w-20"></div>
                  <div className="h-8 bg-[var(--bg-secondary)] rounded w-8"></div>
                </div>
              </div>
            ))
          : resources.map((resource) => (
              <div
                key={resource._id}
                className="bg-[var(--bg-card)] rounded-xl shadow-md hover:shadow-lg transition p-6 flex flex-col border border-[var(--border-color)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <FileText size={24} />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-full">
                    {resource.fileType}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 line-clamp-1">
                  {resource.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
                  {resource.description}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-4">
                    <span>{resource.department}</span>
                    <span>Sem {resource.semester}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewResource(resource)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition text-sm font-semibold border border-[var(--border-color)]"
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
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-md"
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
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)]">
          <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">
            No resources found
          </h3>
          <p className="text-[var(--text-muted)]">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <ResourcePreview
          resource={previewResource}
          onClose={() => setPreviewResource(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default Resources;
