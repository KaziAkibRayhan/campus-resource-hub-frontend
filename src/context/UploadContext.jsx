// src/context/UploadContext.jsx
// Runs resource uploads in the background so the user can keep browsing.
// Exposes the current upload's phase/progress for the global progress bar:
//   uploading -> checking (content safety scan) -> success | rejected | error
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { resourceService } from "../services/api";

const UploadContext = createContext(null);

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const [upload, setUpload] = useState(null);
  const busyRef = useRef(false);
  const hideTimerRef = useRef(null);

  const dismissUpload = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setUpload(null);
  }, []);

  const startUpload = useCallback((formData) => {
    if (busyRef.current) {
      toast.error("Another upload is still in progress. Please wait for it to finish.");
      return false;
    }
    busyRef.current = true;
    clearTimeout(hideTimerRef.current);

    const file = formData.get("file");
    setUpload({
      fileName: file?.name || "file",
      title: formData.get("title") || "",
      phase: "uploading",
      progress: 0,
      message: "",
    });

    (async () => {
      try {
        const response = await resourceService.upload(formData, (event) => {
          const pct = event.total
            ? Math.round((event.loaded / event.total) * 100)
            : 0;
          setUpload((current) =>
            current
              ? {
                  ...current,
                  progress: pct,
                  phase: pct >= 100 ? "checking" : "uploading",
                }
              : current
          );
        });

        // Flagged uploads come back published-pending: stored but held for
        // an admin to review. Show a distinct "under review" state instead of
        // a plain success so the user knows it isn't public yet.
        const underReview = response.data.code === "UNDER_REVIEW";
        setUpload((current) =>
          current
            ? {
                ...current,
                phase: underReview ? "review" : "success",
                progress: 100,
                message: underReview ? response.data.message : "",
              }
            : current
        );
        if (underReview) {
          toast.info("Your resource is under review by a moderator.");
        } else {
          toast.success(response.data.message || "Resource uploaded successfully!");
        }
        window.dispatchEvent(
          new CustomEvent("resource:uploaded", { detail: response.data.resource })
        );
        if (!underReview) {
          // "review" stays on screen until dismissed; success auto-hides.
          hideTimerRef.current = setTimeout(() => {
            setUpload((current) =>
              current?.phase === "success" ? null : current
            );
          }, 6000);
        }
      } catch (error) {
        const data = error.response?.data;
        if (data?.code === "CONTENT_REJECTED") {
          // Stays on screen until the user dismisses it.
          setUpload((current) =>
            current
              ? { ...current, phase: "rejected", message: data.message }
              : current
          );
          toast.error("Upload blocked by the content safety check.");
        } else {
          const message =
            error.code === "ECONNABORTED"
              ? "Upload timed out. Please try again with a smaller file or check your connection."
              : data?.message || "Error uploading resource";
          setUpload((current) =>
            current ? { ...current, phase: "error", message } : current
          );
          toast.error(message);
        }
      } finally {
        busyRef.current = false;
      }
    })();

    return true;
  }, []);

  const isUploading =
    upload?.phase === "uploading" || upload?.phase === "checking";

  return (
    <UploadContext.Provider
      value={{ upload, isUploading, startUpload, dismissUpload }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export default UploadContext;
