import React, { useEffect, useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  AlertTriangle,
  BookOpen,
  Paperclip,
} from "lucide-react";
import { resourceService } from "../../services/api";
import ShareMenu from "./ShareMenu";
import PdfPreview from "./PdfPreview";
import PptxPreview from "./PptxPreview";
import XlsxPreview from "./XlsxPreview";

const getResourceFileType = (resource) =>
  String(
    resource?.fileType ||
      (resource?.resourceType === "TEXT" ? "TEXT" : "")
  ).toUpperCase();

const getResourceTypeLabel = (resource) =>
  getResourceFileType(resource) === "TEXT"
    ? "BLOG / TEXT"
    : getResourceFileType(resource) || "FILE";

const ResourcePreview = ({ resource, onClose, onDownload }) => {
  const [resolvedResource, setResolvedResource] = useState(resource);
  const [contentLoading, setContentLoading] = useState(
    () =>
      Boolean(resource?._id) &&
      getResourceFileType(resource) === "TEXT" &&
      !resource?.content
  );
  const [contentError, setContentError] = useState(false);
  const activeResource = resolvedResource || resource;
  const fileType = getResourceFileType(activeResource);
  const extension = (activeResource?.fileUrl || "")
    .split("?")[0]
    .split(".")
    .pop()
    ?.toLowerCase();
  const isText = fileType === "TEXT";
  const isImage = fileType === "IMAGE";
  const isPdf = fileType === "PDF";
  const isWord = ["DOCX", "DOC"].includes(fileType);
  const isPresentation = ["PPTX", "PPT"].includes(fileType);
  const isSpreadsheet = fileType === "XLSX";
  const hasFile = Boolean(activeResource?.fileUrl);
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

  useEffect(() => {
    if (
      !resource?._id ||
      getResourceFileType(resource) !== "TEXT" ||
      resource.content
    ) {
      return undefined;
    }

    let active = true;

    resourceService
      .getById(resource._id)
      .then((response) => {
        if (active && response.data?.resource) {
          setResolvedResource(response.data.resource);
        }
      })
      .catch(() => {
        if (active) setContentError(true);
      })
      .finally(() => {
        if (active) setContentLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resource]);

  if (!resource) return null;

  const textBody =
    activeResource?.content ||
    activeResource?.contentPreview ||
    activeResource?.description ||
    "No text content is available for this resource.";
  const wordCount = textBody.trim() ? textBody.trim().split(/\s+/).length : 0;
  const fileSize = Number(activeResource?.fileSize);
  const fileSizeLabel = Number.isFinite(fileSize)
    ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
    : "—";
  const downloadName =
    activeResource?.originalFileName || activeResource?.title || "resource-file";

  const getPreviewUrl = () => {
    // Stream PDFs through our server so the browser renders them natively
    // (Cloudinary blocks direct PDF delivery). Office docs go through the
    // Microsoft Office online viewer pointed at the same server-streamed URL.
    const proxyUrl = resourceService.fileUrl(activeResource._id);
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
                {isText ? <BookOpen size={19} /> : <FileText size={19} />}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-[var(--text-main)] sm:max-w-md sm:text-lg">
                  {activeResource.title}
                </h3>
                <p className="truncate text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                  {getResourceTypeLabel(activeResource)} • {activeResource.department} • Sem {activeResource.semester}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <ShareMenu resource={activeResource} variant="icon" align="right" />
              {hasFile && (
                <button
                  type="button"
                  onClick={() =>
                    onDownload(activeResource._id, activeResource.fileUrl, downloadName)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-500 transition hover:bg-[var(--bg-hover)] sm:h-10 sm:w-10"
                  title={isText ? "Download attachment" : "Download"}
                  aria-label={isText ? "Download attachment" : "Download resource"}
                >
                  <Download size={19} />
                </button>
              )}
              <button
                type="button"
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

          {isText ? (
            contentLoading ? (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-violet-500" />
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  Loading full text...
                </p>
              </div>
            ) : (
              <div className="h-full w-full overflow-y-auto bg-[var(--bg-secondary)] p-3 sm:p-8">
                <article className="mx-auto max-w-3xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-8">
                  {activeResource.description &&
                    activeResource.description !== textBody && (
                      <p className="mb-6 border-l-4 border-violet-500/60 pl-4 text-sm italic leading-relaxed text-[var(--text-muted)]">
                        {activeResource.description}
                      </p>
                    )}
                  {contentError && (
                    <p className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                      The full text could not be loaded. Showing the available preview instead.
                    </p>
                  )}
                  <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-[var(--text-main)] sm:text-base sm:leading-8">
                    {textBody}
                  </div>
                  {hasFile && (
                    <div className="mt-8 flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Paperclip className="flex-shrink-0 text-violet-500" size={20} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
                            Attachment
                          </p>
                          <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                            {activeResource.originalFileName ||
                              `${activeResource.attachmentFileType || "File"} attachment`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onDownload(activeResource._id, activeResource.fileUrl, downloadName)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  )}
                </article>
              </div>
            )
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <AlertTriangle size={48} className="text-amber-500 mb-4" />
              <h4 className="text-xl font-bold text-[var(--text-main)] mb-2">Preview failed to load</h4>
              <p className="text-[var(--text-muted)] mb-6">There was an issue loading the preview for this file.</p>
              {hasFile && (
                <button
                  type="button"
                  onClick={() =>
                    onDownload(activeResource._id, activeResource.fileUrl, downloadName)
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold"
                >
                  Download Instead
                </button>
              )}
            </div>
          ) : isEmbeddable ? (
            isImage ? (
              <img
                src={activeResource.fileUrl}
                alt={activeResource.title}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
                className="max-w-full max-h-full object-contain shadow-xl"
              />
            ) : isPdf ? (
              <PdfPreview
                url={resourceService.fileUrl(activeResource._id)}
                title={activeResource.title}
                mode="viewer"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            ) : isWordPreviewable ? (
              <iframe
                src={resourceService.previewHtmlUrl(activeResource._id)}
                className="w-full h-full border-none bg-white"
                title={activeResource.title}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            ) : isPresentationPreviewable ? (
              <PptxPreview
                url={resourceService.fileUrl(activeResource._id)}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            ) : isSpreadsheetPreviewable ? (
              <XlsxPreview
                url={resourceService.fileUrl(activeResource._id)}
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
                title={activeResource.title}
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
                This file type <strong>{getResourceTypeLabel(activeResource)}</strong> cannot be previewed directly in the browser.
              </p>
              {hasFile && (
                <button
                  type="button"
                  onClick={() =>
                    onDownload(activeResource._id, activeResource.fileUrl, downloadName)
                  }
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg font-bold flex items-center space-x-3 text-lg active:scale-95"
                >
                  <Download size={24} />
                  <span>Download File</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-3 text-xs sm:flex sm:items-center sm:gap-4 sm:text-sm">
              <div className="min-w-0">
                <span className="text-[var(--text-muted)]">Course:</span>
                <span className="ml-1 break-words font-bold text-[var(--text-main)]">{activeResource.course}</span>
              </div>
              <div className="hidden h-4 w-px bg-[var(--border-color)] sm:block"></div>
              <div className="min-w-0">
                <span className="text-[var(--text-muted)]">{isText ? "Content:" : "Size:"}</span>
                <span className="ml-1 break-words font-bold text-[var(--text-main)]">
                  {isText ? `${wordCount} words` : fileSizeLabel}
                </span>
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
