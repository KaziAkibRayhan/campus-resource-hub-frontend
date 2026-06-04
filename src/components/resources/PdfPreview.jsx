import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PdfCanvas = ({ pdf, pageNumber, scale = 1, className = "" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask;

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const ratio = window.devicePixelRatio || 1;

      canvas.width = viewport.width * ratio;
      canvas.height = viewport.height * ratio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      renderTask = page.render({ canvasContext: context, viewport });
      await renderTask.promise;
    };

    renderPage().catch(() => {});

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, scale]);

  return <canvas ref={canvasRef} className={className} />;
};

const PdfPreview = ({ url, title, mode = "viewer", onLoad, onError }) => {
  const [pdf, setPdf] = useState(null);
  const [status, setStatus] = useState("loading");
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  useEffect(() => {
    let cancelled = false;
    let loadingTask;

    const loadPdf = async () => {
      try {
        setStatus("loading");
        loadingTask = pdfjs.getDocument({
          url,
          withCredentials: false,
          disableRange: true,
          disableStream: true,
        });
        const loadedPdf = await loadingTask.promise;
        if (cancelled) return;
        setPdf(loadedPdf);
        setStatus("ready");
        onLoadRef.current?.();
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        onErrorRef.current?.(error);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [url]);

  if (status === "loading") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (status === "error" || !pdf) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <span className="text-sm font-semibold">Preview unavailable</span>
      </div>
    );
  }

  if (mode === "thumbnail") {
    return (
      <div className="flex h-full w-full items-start justify-center overflow-hidden bg-white">
        <PdfCanvas
          pdf={pdf}
          pageNumber={1}
          scale={0.38}
          className="max-w-none shadow-sm"
          title={title}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-slate-200 p-3 dark:bg-slate-950 sm:p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4">
        {Array.from({ length: pdf.numPages }, (_, index) => (
          <div key={index + 1} className="max-w-full overflow-auto rounded bg-white shadow-lg">
            <PdfCanvas
              pdf={pdf}
              pageNumber={index + 1}
              scale={window.innerWidth < 640 ? 0.58 : 1.25}
              className="block max-w-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PdfPreview;
