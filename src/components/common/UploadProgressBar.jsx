// src/components/common/UploadProgressBar.jsx
// Slim status strip shown at the top of the app (below the header) while a
// resource uploads in the background, with a persistent warning when the
// content safety check rejects the file.
import React from "react";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { useUpload } from "../../context/UploadContext";

const UploadProgressBar = () => {
  const { upload, dismissUpload } = useUpload();

  if (!upload) return null;

  const { phase, progress, fileName, message } = upload;

  // Flagged uploads are stored but held for a moderator to review.
  if (phase === "review") {
    return (
      <div className="px-4 py-3 border-b flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800">
        <Clock className="text-indigo-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            Under review — {fileName}
          </p>
          <p className="text-sm mt-0.5 text-indigo-700 dark:text-indigo-400">
            {message ||
              "Your resource was uploaded and is awaiting moderator approval before it becomes visible."}
          </p>
        </div>
        <button
          onClick={dismissUpload}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={18} className="text-[var(--text-muted)]" />
        </button>
      </div>
    );
  }

  if (phase === "rejected" || phase === "error") {
    const isRejected = phase === "rejected";
    return (
      <div
        className={`px-4 py-3 border-b flex items-start gap-3 ${
          isRejected
            ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
            : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
        }`}
      >
        {isRejected ? (
          <ShieldAlert className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
        ) : (
          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              isRejected
                ? "text-red-800 dark:text-red-300"
                : "text-amber-800 dark:text-amber-300"
            }`}
          >
            {isRejected ? "Upload blocked" : "Upload failed"} — {fileName}
          </p>
          <p
            className={`text-sm mt-0.5 ${
              isRejected
                ? "text-red-700 dark:text-red-400"
                : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {message}
          </p>
        </div>
        <button
          onClick={dismissUpload}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={18} className="text-[var(--text-muted)]" />
        </button>
      </div>
    );
  }

  const isChecking = phase === "checking";
  const isSuccess = phase === "success";

  return (
    <div className="px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
        ) : isChecking ? (
          <ShieldCheck className="text-blue-500 flex-shrink-0 animate-pulse" size={18} />
        ) : (
          <Loader2 className="text-blue-500 flex-shrink-0 animate-spin" size={18} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-[var(--text-main)] truncate">
              {isSuccess
                ? `${fileName} uploaded successfully`
                : isChecking
                ? `Checking content of ${fileName} for safety…`
                : `Uploading ${fileName}…`}
            </p>
            {!isSuccess && !isChecking && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0">
                {progress}%
              </span>
            )}
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-main)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isSuccess
                  ? "bg-green-500"
                  : isChecking
                  ? "bg-blue-500 animate-pulse"
                  : "bg-blue-500"
              }`}
              style={{ width: `${isChecking || isSuccess ? 100 : progress}%` }}
            />
          </div>
        </div>
        {isSuccess && (
          <button
            onClick={dismissUpload}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadProgressBar;
