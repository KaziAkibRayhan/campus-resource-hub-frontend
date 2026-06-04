import React, { useState } from "react";
import { X, Download, ExternalLink, FileText, Loader2, AlertTriangle } from "lucide-react";
import { resourceService } from "../../services/api";
import ShareMenu from "./ShareMenu";
import PdfPreview from "./PdfPreview";
import PptxPreview from "./PptxPreview";
import XlsxPreview from "./XlsxPreview";

const ResourcePreview = ({ resource, onClose, onDownload }) => {
  const extension = (resource?.fileUrl || "")
    .split("?")[0]
    .split(".")
    .pop()
    ?.toLowerCase();
  const isImage = resource?.fileType === "IMAGE";
  const isPdf = resource?.fileType === "PDF";
  const isWord = ["DOCX", "DOC"].includes(resource?.fileType);
  const isPresentation = ["PPTX", "PPT"].includes(resource?.fileType);
  const isSpreadsheet = resource?.fileType === "XLSX";
  const isWordPreviewable =
    isWord && ["docx", "docm", "dotx", "dotm"].includes(extension);
  const isPresentationPreviewable =
    isPresentation && ["pptx", "pptm", "ppsx", "ppsm", "potx", "potm"].includes(extension);
  const isSpreadsheetPreviewable =
    isSpreadsheet && ["xls", "xlsx", "xlsm", "xlsb", "xlt", "xltx", "xltm"].includes(extension);
  const isOffice = false;
  const isEmbeddable =
    isPdf || isImage || isWordPreviewable || isPresentationPreviewable || isSpreadsheetPreviewable;
  const [loading, setLoading] = useState(() => isEmbeddable);
  const [error, setError] = useState(false);

  if (!resource) return null;

  const getPreviewUrl = () => {
    // Stream PDFs through our server so the browser renders them natively
    // (Cloudinary blocks direct PDF delivery). Office docs go through the
    // Microsoft Office online viewer pointed at the same server-streamed URL.
    const proxyUrl = resourceService.fileUrl(resource._id);
    if (isOffice) {
      const absolute = new URL(proxyUrl, window.location.origin).href;
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolute)}`;
    }
    return proxyUrl;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md animate-in fade-in duration-300 sm:p-4">
      <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-5xl h-[calc(100dvh-1rem)] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--border-color)] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:p-4">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 sm:h-10 sm:w-10">
                <FileText size={19} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-[var(--text-main)] sm:max-w-md sm:text-lg">
                  {resource.title}
                </h3>
                <p className="truncate text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                  {resource.fileType} • {resource.department} • Sem {resource.semester}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <ShareMenu resource={resource} variant="icon" align="right" />
              <button
                onClick={() => onDownload(resource._id, resource.fileUrl, resource.title)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-500 transition hover:bg-[var(--bg-hover)] sm:h-10 sm:w-10"
                title="Download"
              >
                <Download size={19} />
              </button>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] sm:h-10 sm:w-10"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-900 relative flex items-center justify-center">
          {loading && isEmbeddable && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-card)] z-10">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
              <p className="text-sm text-[var(--text-muted)] font-medium">Preparing preview...</p>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <AlertTriangle size={48} className="text-amber-500 mb-4" />
              <h4 className="text-xl font-bold text-[var(--text-main)] mb-2">Preview failed to load</h4>
              <p className="text-[var(--text-muted)] mb-6">There was an issue loading the preview for this file.</p>
              <button
                onClick={() => onDownload(resource._id, resource.fileUrl, resource.title)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold"
              >
                Download Instead
              </button>
            </div>
          ) : isEmbeddable ? (
            isImage ? (
              <img
                src={resource.fileUrl}
                alt={resource.title}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
                className="max-w-full max-h-full object-contain shadow-xl"
              />
            ) : isPdf ? (
              <PdfPreview
                url={resourceService.fileUrl(resource._id)}
                title={resource.title}
                mode="viewer"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            ) : isWordPreviewable ? (
              <iframe
                src={resourceService.previewHtmlUrl(resource._id)}
                className="w-full h-full border-none bg-white"
                title={resource.title}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            ) : isPresentationPreviewable ? (
              <PptxPreview
                url={resourceService.fileUrl(resource._id)}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            ) : isSpreadsheetPreviewable ? (
              <XlsxPreview
                url={resourceService.fileUrl(resource._id)}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            ) : (
              <iframe
                src={getPreviewUrl()}
                className="w-full h-full border-none"
                title={resource.title}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12">
              <div className="bg-[var(--bg-secondary)] p-8 rounded-full mb-6 shadow-inner">
                <ExternalLink size={64} className="text-[var(--text-muted)]" />
              </div>
              <h4 className="text-2xl font-bold text-[var(--text-main)] mb-3">
                No Preview Available
              </h4>
              <p className="text-[var(--text-muted)] max-w-sm mb-8 text-lg">
                This file type <strong>{resource.fileType}</strong> cannot be previewed directly in the browser.
              </p>
              <button
                onClick={() => onDownload(resource._id, resource.fileUrl, resource.title)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg font-bold flex items-center space-x-3 text-lg active:scale-95"
              >
                <Download size={24} />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-3 text-xs sm:flex sm:items-center sm:gap-4 sm:text-sm">
              <div className="min-w-0">
                <span className="text-[var(--text-muted)]">Course:</span>
                <span className="ml-1 break-words font-bold text-[var(--text-main)]">{resource.course}</span>
              </div>
              <div className="hidden h-4 w-px bg-[var(--border-color)] sm:block"></div>
              <div className="min-w-0">
                <span className="text-[var(--text-muted)]">Size:</span>
                <span className="ml-1 break-words font-bold text-[var(--text-main)]">{(resource.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
            <p className="text-left text-[10px] text-[var(--text-muted)] italic sm:text-right sm:text-xs">
              Powered by Campus Resource Hub Preview System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePreview;
