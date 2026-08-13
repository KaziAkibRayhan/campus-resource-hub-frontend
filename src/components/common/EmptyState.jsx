// Friendly empty state for lists: icon, title, hint, optional action button.
//
//   <EmptyState icon={Package} title="No items found"
//     hint="Try adjusting your search or filters."
//     actionLabel="Post an item" onAction={() => setShowForm(true)} />
import React from "react";
import { Inbox } from "lucide-react";

const EmptyState = ({ icon = Inbox, title, hint, actionLabel, onAction, compact = false }) => {
  const EmptyIcon = icon;
  return <div
    className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] text-center ${
      compact ? "p-8" : "p-14"
    }`}
  >
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
      <EmptyIcon size={26} />
    </div>
    <p className="text-base font-bold text-[var(--text-main)]">{title}</p>
    {hint && <p className="mt-1.5 max-w-sm text-sm text-[var(--text-muted)]">{hint}</p>}
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {actionLabel}
      </button>
    )}
  </div>;
};

export default EmptyState;
