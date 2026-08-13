// Promise-based confirmation dialog — replaces window.confirm with a themed
// modal. Mount <ConfirmProvider> once (App.jsx); call from anywhere:
//
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: "Delete resource?",
//     message: `"${resource.title}" will be permanently removed.`,
//     confirmText: "Delete",
//     variant: "danger",          // danger | warning | success | info
//   });
//   if (!ok) return;
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle, Info, Trash2 } from "lucide-react";

const ConfirmContext = createContext(() => Promise.resolve(false));

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = () => useContext(ConfirmContext);

const VARIANTS = {
  danger: {
    Icon: Trash2,
    iconWrap: "bg-red-500/10 text-red-500 border border-red-500/20",
    button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/40",
  },
  warning: {
    Icon: AlertTriangle,
    iconWrap: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500/40",
  },
  success: {
    Icon: CheckCircle,
    iconWrap: "bg-green-500/10 text-green-500 border border-green-500/20",
    button: "bg-green-600 hover:bg-green-700 focus-visible:ring-green-500/40",
  },
  info: {
    Icon: Info,
    iconWrap: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500/40",
  },
};

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const confirmButtonRef = useRef(null);

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        setDialog({ ...options, resolve });
      }),
    []
  );

  const close = useCallback(
    (result) => {
      dialog?.resolve(result);
      setDialog(null);
    },
    [dialog]
  );

  useEffect(() => {
    if (!dialog) return;
    confirmButtonRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dialog, close]);

  const variant = VARIANTS[dialog?.variant] || VARIANTS.info;
  const { Icon } = variant;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-backdrop"
            onClick={() => close(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl modal-panel">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${variant.iconWrap}`}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  {dialog.title || "Are you sure?"}
                </h3>
                {dialog.message && (
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                    {dialog.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-hover)]"
              >
                {dialog.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                onClick={() => close(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 ${variant.button}`}
              >
                {dialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
