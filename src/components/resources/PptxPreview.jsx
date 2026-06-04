import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { init } from "pptx-preview";

const PptxPreview = ({ url, mode = "viewer", onLoad, onError }) => {
  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState("loading");
  const isThumbnail = mode === "thumbnail";

  const normalizeRenderedPresentation = () => {
    if (!containerRef.current) return;

    const wrapper = containerRef.current.querySelector(".pptx-preview-wrapper");
    if (wrapper) {
      wrapper.style.background = isThumbnail ? "transparent" : "#020617";
      wrapper.style.margin = "0 auto";
      wrapper.style.maxWidth = "100%";
      wrapper.style.overflowX = "hidden";
      wrapper.style.overflowY = isThumbnail ? "hidden" : "visible";
      wrapper.style.height = isThumbnail ? "100%" : "auto";
    }

    containerRef.current
      .querySelectorAll(".pptx-preview-wrapper-next, .pptx-preview-wrapper-pagination")
      .forEach((element) => {
        element.style.display = "none";
      });

    const slides = containerRef.current.querySelectorAll(".pptx-preview-slide-wrapper");
    slides.forEach((slide, index) => {
      slide.style.margin = isThumbnail ? "0" : "0 auto 16px";
      slide.style.maxWidth = "100%";
      slide.style.boxShadow = isThumbnail
        ? "none"
        : "0 18px 42px rgba(15, 23, 42, 0.24)";
      if (isThumbnail && index > 0) {
        slide.style.display = "none";
      }
    });

    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
      viewportRef.current.scrollLeft = 0;
    }
  };

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  useEffect(() => {
    let cancelled = false;

    const loadPresentation = async () => {
      try {
        setStatus("loading");
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Unable to load presentation");
        }

        const buffer = await response.arrayBuffer();
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        const viewportStyle = viewportRef.current
          ? window.getComputedStyle(viewportRef.current)
          : null;
        const horizontalPadding = viewportStyle
          ? parseFloat(viewportStyle.paddingLeft || "0") +
            parseFloat(viewportStyle.paddingRight || "0")
          : 0;
        const viewportWidth =
          (viewportRef.current?.clientWidth || containerRef.current.clientWidth || 960) -
          horizontalPadding;
        const width = Math.max(220, Math.min(viewportWidth, isThumbnail ? 520 : 960));
        const options = {
          width,
          mode: isThumbnail ? "slide" : "list",
        };

        if (isThumbnail) {
          options.height = Math.round(width * 0.5625);
        }

        const viewer = init(containerRef.current, {
          ...options,
        });

        await viewer.preview(buffer);
        if (cancelled) return;

        normalizeRenderedPresentation();
        setStatus("ready");
        onLoadRef.current?.();
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        onErrorRef.current?.(error);
      }
    };

    loadPresentation();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [url]);

  if (status === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        {!isThumbnail && <span className="text-sm font-semibold">PPTX preview unavailable</span>}
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={
        isThumbnail
          ? "relative h-full w-full overflow-hidden bg-white"
          : "relative h-full w-full overflow-auto bg-slate-200 p-3 dark:bg-slate-950 sm:p-6"
      }
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-card)]">
          <Loader2 className={isThumbnail ? "h-5 w-5 animate-spin text-blue-500" : "h-8 w-8 animate-spin text-blue-500"} />
        </div>
      )}
      <div
        ref={containerRef}
        className={isThumbnail ? "h-full w-full" : "mx-auto flex w-full max-w-5xl flex-col items-center"}
      />
    </div>
  );
};

export default PptxPreview;
