// src/pages/Resources.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Upload,
  Filter,
  Download,
  Eye,
  BookOpen,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { departments, semesters } from "../utils/constants";
import { resourceService } from "../services/api";
import { toast } from "sonner";
import ResourcePreview from "../components/resources/ResourcePreview";
import ShareMenu from "../components/resources/ShareMenu";
import PdfPreview from "../components/resources/PdfPreview";
import PptxPreview from "../components/resources/PptxPreview";
import { SkeletonGrid } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import useHighlight from "../hooks/useHighlight";
import useDebounce from "../hooks/useDebounce";
import { useSocket } from "../context/SocketContext";

const Resources = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  useHighlight(!loading);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [isSemantic, setIsSemantic] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [previewResource, setPreviewResource] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const pageSize = 12;

  const getDocumentBadgeClass = (fileType) => {
    if (fileType === "PDF") return "bg-red-600/90";
    if (["PPT", "PPTX"].includes(fileType)) return "bg-orange-600/90";
    if (fileType === "XLSX") return "bg-green-600/90";
    return "bg-blue-600/90";
  };

  // Lightweight, fast document thumbnail styling (no external viewers).
  const getDocumentThumb = (fileType) => {
    if (fileType === "PDF")
      return { Icon: FileText, from: "from-red-500/15", to: "to-rose-500/5", ring: "text-red-500" };
    if (["PPT", "PPTX"].includes(fileType))
      return { Icon: Presentation, from: "from-orange-500/15", to: "to-amber-500/5", ring: "text-orange-500" };
    if (fileType === "XLSX")
      return { Icon: FileSpreadsheet, from: "from-green-500/15", to: "to-emerald-500/5", ring: "text-green-500" };
    if (["DOC", "DOCX"].includes(fileType))
      return { Icon: FileText, from: "from-blue-500/15", to: "to-sky-500/5", ring: "text-blue-500" };
    return { Icon: File, from: "from-slate-500/15", to: "to-slate-500/5", ring: "text-slate-400" };
  };

  const getResourceExtension = (resource) =>
    (resource?.fileUrl || "")
      .split("?")[0]
      .split(".")
      .pop()
      ?.toLowerCase();

  const canPreviewWord = (resource) =>
    ["DOCX", "DOC"].includes(resource.fileType) &&
    ["docx", "docm", "dotx", "dotm"].includes(getResourceExtension(resource));

  const canPreviewPresentation = (resource) =>
    ["PPTX", "PPT"].includes(resource.fileType) &&
    ["pptx", "pptm", "ppsx", "ppsm", "potx", "potm"].includes(getResourceExtension(resource));

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedDepartment !== "all") params.department = selectedDepartment;
      if (selectedSemester !== "all") params.semester = selectedSemester;
      params.sortBy = sortBy;
      params.order = order;
      params.page = currentPage;
      params.limit = pageSize;

      const response = await resourceService.getAll(params);
      setResources(response.data.resources);
      setIsSemantic(Boolean(response.data.semantic));
      const nextTotalPages = response.data.totalPages || 1;
      setTotalPages(nextTotalPages);
      setTotalResources(response.data.total || 0);
      if (currentPage > nextTotalPages) {
        setCurrentPage(nextTotalPages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedDepartment, selectedSemester, sortBy, order, currentPage]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Refresh when a background upload finishes
  useEffect(() => {
    const onUploaded = () => fetchResources();
    window.addEventListener("resource:uploaded", onUploaded);
    return () => window.removeEventListener("resource:uploaded", onUploaded);
  }, [fetchResources]);

  // Realtime: refresh list when anyone uploads a new resource
  useEffect(() => {
    if (!socket) return;
    const onResourceNew = () => fetchResources();
    socket.on("resource:new", onResourceNew);
    return () => socket.off("resource:new", onResourceNew);
  }, [socket, fetchResources]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedDepartment, selectedSemester, sortBy, order]);

  const handleDownload = async (id, _fileUrl, fileName) => {
    try {
      resourceService.incrementDownload(id).catch(() => {});

      // Download through the server proxy — Content-Disposition: attachment
      // forces a save and works even though Cloudinary blocks direct PDF URLs.
      const link = document.createElement("a");
      link.href = resourceService.fileUrl(id, { download: true });
      link.setAttribute("download", fileName || "resource-file");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.info("Download started", {
        description: fileName || "Your file is being downloaded.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.response?.data?.message || "Error downloading file");
    }
  };

  // Open a shared resource directly when arriving via ?resource=<id>.
  useEffect(() => {
    const sharedId = searchParams.get("resource");
    if (!sharedId || loading || !resources.length) return;
    const match = resources.find((item) => item._id === sharedId);
    if (match) {
      setPreviewResource(match);
      searchParams.delete("resource");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, resources, loading, setSearchParams]);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-main)]">
              Academic Resources
            </h2>
            <p className="text-[var(--text-muted)] mt-1">
              Browse and download study materials
            </p>
          </div>
        </div>
        <Link
          to="/upload-resource"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
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
          <span className="font-semibold text-[var(--text-main)]">
            {totalResources === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            -
            {Math.min(currentPage * pageSize, totalResources)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[var(--text-main)]">
            {totalResources}
          </span>{" "}
          resources
          {isSemantic && debouncedSearch && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 align-middle">
              <Sparkles size={11} /> Semantic search
            </span>
          )}
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
      {loading ? (
        <SkeletonGrid
          count={8}
          media
          lines={2}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((resource) => (
              <div
                id={`hl-${resource._id}`}
                key={resource._id}
                className="bg-[var(--bg-card)] rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition p-5 flex flex-col border border-[var(--border-color)] overflow-hidden"
              >
                {resource.fileType === "IMAGE" ? (
                  <div
                    onClick={() => setPreviewResource(resource)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPreviewResource(resource);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="group/thumb relative mb-4 aspect-[16/9] overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer"
                    title="Click to preview"
                  >
                    <img
                      src={resource.fileUrl}
                      alt={resource.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-transparent transition-colors group-hover/thumb:bg-black/10" />
                    <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow">
                      <Eye size={13} /> Click to preview
                    </span>
                    <span className="absolute right-2 top-2 text-xs font-bold px-2 py-1 bg-slate-950/70 text-white rounded-full">
                      IMAGE
                    </span>
                  </div>
                ) : resource.fileType === "PDF" ? (
                  <div
                    onClick={() => setPreviewResource(resource)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPreviewResource(resource);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="group/thumb relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer"
                    title="Click to preview"
                  >
                    <PdfPreview
                      url={resourceService.fileUrl(resource._id)}
                      title={resource.title}
                      mode="thumbnail"
                    />
                    <div className="absolute inset-0 bg-transparent transition-colors group-hover/thumb:bg-black/10" />
                    <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow">
                      <Eye size={13} /> Click to preview
                    </span>
                    <span className="absolute right-2 top-2 text-xs font-bold px-2 py-1 bg-red-600/90 text-white rounded-full">
                      PDF
                    </span>
                  </div>
                ) : canPreviewWord(resource) ? (
                  <div
                    onClick={() => setPreviewResource(resource)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPreviewResource(resource);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="group/thumb relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-lg border border-[var(--border-color)] bg-white cursor-pointer"
                    title="Click to preview"
                  >
                    <iframe
                      src={resourceService.previewHtmlUrl(resource._id)}
                      title={`${resource.title} preview`}
                      loading="lazy"
                      className="h-[260%] w-[260%] origin-top-left scale-[0.385] border-0 bg-white pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-transparent transition-colors group-hover/thumb:bg-black/10" />
                    <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-slate-900 flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow">
                      <Eye size={13} /> Click to preview
                    </span>
                    <span className="absolute right-2 top-2 text-xs font-bold px-2 py-1 bg-blue-600/90 text-white rounded-full">
                      {resource.fileType}
                    </span>
                  </div>
                ) : canPreviewPresentation(resource) ? (
                  <div
                    onClick={() => setPreviewResource(resource)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPreviewResource(resource);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="group/thumb relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-lg border border-[var(--border-color)] bg-white cursor-pointer"
                  >
                    <PptxPreview
                      url={resourceService.fileUrl(resource._id)}
                      mode="thumbnail"
                    />
                    <div className="absolute inset-0 bg-transparent transition-colors group-hover/thumb:bg-black/10" />
                    <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-slate-900 flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow">
                      <Eye size={13} /> Click to preview
                    </span>
                    <span className="absolute right-2 top-2 text-xs font-bold px-2 py-1 bg-orange-600/90 text-white rounded-full">
                      {resource.fileType}
                    </span>
                  </div>
                ) : (
                  (() => {
                    const { Icon, from, to, ring } = getDocumentThumb(resource.fileType);
                    return (
                      <button
                        onClick={() => setPreviewResource(resource)}
                        className={`group/thumb relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-lg border border-[var(--border-color)] bg-gradient-to-br ${from} ${to} flex items-center justify-center`}
                        title="Click to preview"
                      >
                        <Icon
                          size={52}
                          className={`${ring} opacity-90 transition-transform duration-300 group-hover/thumb:scale-110`}
                          strokeWidth={1.5}
                        />
                        <div className="absolute inset-0 bg-[var(--text-main)]/0 group-hover/thumb:bg-[var(--text-main)]/[0.03] transition-colors" />
                        <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <Eye size={13} /> Click to preview
                        </span>
                        <span
                          className={`absolute right-2 top-2 text-xs font-bold px-2 py-1 ${getDocumentBadgeClass(
                            resource.fileType
                          )} text-white rounded-full`}
                        >
                          {resource.fileType}
                        </span>
                      </button>
                    );
                  })()
                )}
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
                    <ShareMenu resource={resource} variant="icon" align="right" />
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
      )}

      {!loading && resources.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No resources found"
          hint={
            debouncedSearch ||
            selectedDepartment !== "all" ||
            selectedSemester !== "all"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Be the first to share study materials with your campus."
          }
          actionLabel="Upload a resource"
          onAction={() => navigate("/upload-resource")}
        />
      )}

      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-md">
          <p className="text-sm text-[var(--text-muted)]">
            Page{" "}
            <span className="font-bold text-[var(--text-main)]">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[var(--text-main)]">
              {totalPages}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => {
                if (totalPages <= 5) return true;
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, visiblePages) => {
                const previousPage = visiblePages[index - 1];
                const showGap = previousPage && page - previousPage > 1;

                return (
                  <React.Fragment key={page}>
                    {showGap && (
                      <span className="px-1 text-sm text-[var(--text-muted)]">
                        ...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-bold transition ${
                        currentPage === page
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
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
