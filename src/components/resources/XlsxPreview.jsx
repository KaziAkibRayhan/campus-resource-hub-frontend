import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

const XlsxPreview = ({ url, onLoad, onError }) => {
  const [status, setStatus] = useState("loading");
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState("");
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkbook = async () => {
      try {
        setStatus("loading");
        const response = await fetch(url);
        if (!response.ok) throw new Error("Unable to load spreadsheet");

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        const nextWorkbook = XLSX.read(buffer, { type: "array" });
        setWorkbook(nextWorkbook);
        setActiveSheet(nextWorkbook.SheetNames[0] || "");
        setStatus("ready");
        onLoadRef.current?.();
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        onErrorRef.current?.(error);
      }
    };

    loadWorkbook();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const rows = useMemo(() => {
    if (!workbook || !activeSheet) return [];
    const sheet = workbook.Sheets[activeSheet];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  }, [workbook, activeSheet]);

  if (status === "loading") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "error" || !workbook) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <span className="text-sm font-semibold">Spreadsheet preview unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[var(--bg-main)]">
      {workbook.SheetNames.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border-color)] bg-[var(--bg-card)] p-2">
          {workbook.SheetNames.map((sheetName) => (
            <button
              key={sheetName}
              type="button"
              onClick={() => setActiveSheet(sheetName)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeSheet === sheetName
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 sm:p-5">
        <table className="min-w-full border-collapse overflow-hidden rounded-lg bg-[var(--bg-card)] text-left text-sm shadow">
          <tbody>
            {rows.length ? (
              rows.slice(0, 100).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? "bg-blue-500/10" : ""}>
                  {Array.from({ length: Math.max(...rows.map((item) => item.length), 1) }).map((_, colIndex) => (
                    <td
                      key={colIndex}
                      className={`max-w-64 border border-[var(--border-color)] px-3 py-2 align-top ${
                        rowIndex === 0 ? "font-bold text-[var(--text-main)]" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {String(row[colIndex] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-[var(--border-color)] px-3 py-8 text-center text-[var(--text-muted)]">
                  This sheet is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {rows.length > 100 && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Showing first 100 rows for preview.
          </p>
        )}
      </div>
    </div>
  );
};

export default XlsxPreview;
