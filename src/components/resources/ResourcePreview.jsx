import React, { useState } from "react";
import { X, Download, ExternalLink, FileText, Loader2, AlertTriangle } from "lucide-react";
import { resourceService } from "../../services/api";
import ShareMenu from "./ShareMenu";
import PdfPreview from "./PdfPreview";

const ResourcePreview = ({ resource, onClose, onDownload }) => {
  const isImage = resource?.fileType === "IMAGE";
  const isPdf = resource?.fileType === "PDF";
  const isWord = ["DOCX", "DOC"].includes(resource?.fileType);
  const isOffice = ["PPTX", "XLSX", "PPT"].includes(resource?.fileType);
  const isEmbeddable = ["PDF", "IMAGE", "DOCX", "PPTX", "XLSX", "DOC", "PPT"].includes(resource?.fileType);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--border-color)] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[var(--text-main)] truncate max-w-md">
                {resource.title}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                {resource.fileType} • {resource.department} • Sem {resource.semester}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShareMenu resource={resource} variant="icon" align="right" />
            <button
              onClick={() => onDownload(resource._id, resource.fileUrl, resource.title)}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-blue-600"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)]"
              title="Close"
            >
              <X size={20} />
            </button>
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
            ) : isWord ? (
              <iframe
                src={resourceService.previewHtmlUrl(resource._id)}
                className="w-full h-full border-none bg-white"
                title={resource.title}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
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
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-[var(--text-muted)]">Course:</span>
              <span className="ml-1 font-bold text-[var(--text-main)]">{resource.course}</span>
            </div>
            <div className="h-4 w-px bg-[var(--border-color)]"></div>
            <div className="text-sm">
              <span className="text-[var(--text-muted)]">Size:</span>
              <span className="ml-1 font-bold text-[var(--text-main)]">{(resource.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] italic">
            Powered by Campus Resource Hub Preview System
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResourcePreview;
