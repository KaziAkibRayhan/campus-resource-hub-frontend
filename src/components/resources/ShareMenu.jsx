import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Share2,
  Link2,
  Check,
  Mail,
  MessageCircle,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Reusable share control for a resource.
 * - Uses the native Web Share sheet when available (mobile / supported browsers).
 * - Falls back to a polished dropdown: Copy link, WhatsApp, Facebook, Email.
 *
 * Props:
 *   resource  – the resource object (needs _id, title, description)
 *   variant   – "icon" (compact button) | "button" (labelled button)
 *   align     – "left" | "right" dropdown alignment
 */
const ShareMenu = ({ resource, variant = "icon", align = "right" }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const shareUrl = `${window.location.origin}/resources?resource=${resource._id}`;
  const shareTitle = resource.title || "Campus Resource";
  const shareText = `${shareTitle} — ${
    resource.description || "Check out this resource on Campus Resource Hub"
  }`;

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      const clickedTrigger = containerRef.current?.contains(e.target);
      const clickedMenu = menuRef.current?.contains(e.target);
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = containerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = menuRef.current?.offsetHeight || 230;
      const gap = 8;
      const padding = 12;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < menuHeight + gap && spaceAbove > spaceBelow;

      const preferredLeft =
        align === "right" ? rect.right - menuWidth : rect.left;
      const left = Math.min(
        Math.max(preferredLeft, padding),
        window.innerWidth - menuWidth - padding
      );
      const top = openUp
        ? Math.max(rect.top - menuHeight - gap, padding)
        : Math.min(rect.bottom + gap, window.innerHeight - menuHeight - padding);

      setMenuPosition({
        left,
        top,
        transformOrigin: openUp
          ? align === "right"
            ? "bottom right"
            : "bottom left"
          : align === "right"
          ? "top right"
          : "top left",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align]);

  const handleTrigger = async (e) => {
    e.stopPropagation();
    // Prefer the native share sheet when the browser supports it.
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to the menu
      }
    }
    setOpen((v) => !v);
  };

  const copyLink = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
    setOpen(false);
  };

  const options = [
    {
      label: copied ? "Copied!" : "Copy link",
      icon: copied ? Check : Link2,
      onClick: copyLink,
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
      accent: "text-green-600 dark:text-green-400",
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      accent: "text-[#1877F2]",
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
      accent: "text-amber-600 dark:text-amber-400",
    },
  ];

  const triggerClass =
    variant === "button"
      ? "flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition text-sm font-semibold border border-[var(--border-color)]"
      : "p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition border border-[var(--border-color)]";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleTrigger}
        className={triggerClass}
        title="Share"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 size={variant === "button" ? 16 : 18} />
        {variant === "button" && <span>Share</span>}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onClick={(e) => e.stopPropagation()}
            style={{
              left: menuPosition?.left ?? -9999,
              top: menuPosition?.top ?? -9999,
              transformOrigin: menuPosition?.transformOrigin,
            }}
            className="fixed z-[80] w-48 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-2 border-b border-[var(--border-color)]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Share this resource
              </p>
            </div>
            {options.map((opt) => {
              const Icon = opt.icon;
              const inner = (
                <>
                  <Icon size={17} className={opt.accent} />
                  <span className="text-[var(--text-main)]">{opt.label}</span>
                </>
              );
              return opt.href ? (
                <a
                  key={opt.label}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-[var(--bg-hover)] transition"
                  role="menuitem"
                >
                  {inner}
                </a>
              ) : (
                <button
                  key={opt.label}
                  onClick={opt.onClick}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-[var(--bg-hover)] transition text-left"
                  role="menuitem"
                >
                  {inner}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ShareMenu;
