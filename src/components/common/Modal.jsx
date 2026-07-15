// Shared modal shell: backdrop blur, escape/backdrop close, entrance
// animation, sizes. Content is up to the caller.
//
//   <Modal open={open} onClose={...} title="Edit event" size="lg" icon={CalendarDays}>
//     ...body...
//   </Modal>
import React, { useEffect } from "react";
import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl",
};

const Modal = ({ open, onClose, title, subtitle, icon: Icon, size = "lg", children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-backdrop"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${SIZES[size] || SIZES.lg} max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl modal-panel`}
      >
        {(title || onClose) && (
          <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-6 py-4">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Icon size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-[var(--text-main)]">{title}</h3>
              {subtitle && (
                <p className="truncate text-xs text-[var(--text-muted)]">{subtitle}</p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
                title="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-t border-[var(--border-color)] px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
