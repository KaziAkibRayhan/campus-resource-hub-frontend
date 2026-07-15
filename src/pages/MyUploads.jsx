// src/pages/MyUploads.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Megaphone, Calendar, Package,
  Edit3, Trash2, RefreshCw, Save,
  ChevronUp, FolderOpen, Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  resourceService,
  announcementService,
  eventService,
  lostFoundService,
} from "../services/api";
import { departments, semesters } from "../utils/constants";
import { useConfirm } from "../components/common/ConfirmDialog";
import { SkeletonRow } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";

// ── tiny helpers ────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

const BADGE_STYLES = {
  blue:   "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  green:  "bg-green-500/10 text-green-500 border border-green-500/20",
  purple: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
  orange: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
  amber:  "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  red:    "bg-red-500/10 text-red-500 border border-red-500/20",
  gray:   "bg-gray-500/10 text-gray-500 border border-gray-500/20",
};

const Badge = ({ children, color = "blue" }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_STYLES[color] || BADGE_STYLES.blue}`}>
    {children}
  </span>
);

// ── Field components ─────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]" />
);

const Textarea = (props) => (
  <textarea {...props} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)] resize-none" />
);

const Select = ({ options, ...props }) => (
  <select {...props} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]">
    {options.map((o) => (
      <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
    ))}
  </select>
);

// ═══════════════════════════════════════════════════════════════
// EDIT FORMS
// ═══════════════════════════════════════════════════════════════

const ResourceEditForm = ({ item, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    title: item.title || "",
    course: item.course || "",
    department: item.department || "",
    semester: item.semester || "",
    description: item.description || "",
  });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-xl space-y-3 border border-[var(--border-color)]">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Title"><Input value={form.title} onChange={set("title")} /></Field>
        <Field label="Course Code"><Input value={form.course} onChange={set("course")} /></Field>
        <Field label="Department">
          <Select value={form.department} onChange={set("department")} options={departments} />
        </Field>
        <Field label="Semester">
          <Select value={form.semester} onChange={set("semester")} options={semesters.map((s) => ({ value: s, label: `${s} Semester` }))} />
        </Field>
      </div>
      <Field label="Description"><Textarea rows={3} value={form.description} onChange={set("description")} /></Field>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition">Cancel</button>
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
          <Save size={14} />{saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

const AnnouncementEditForm = ({ item, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    title: item.title || "",
    content: item.content || "",
    department: item.department || "All",
  });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-xl space-y-3 border border-[var(--border-color)]">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Title"><Input value={form.title} onChange={set("title")} /></Field>
        <Field label="Department">
          <Select value={form.department} onChange={set("department")} options={["All", ...departments]} />
        </Field>
      </div>
      <Field label="Content"><Textarea rows={4} value={form.content} onChange={set("content")} /></Field>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition">Cancel</button>
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
          <Save size={14} />{saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

const EventEditForm = ({ item, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    title: item.title || "",
    description: item.description || "",
    club: item.club || "",
    date: item.date ? item.date.slice(0, 10) : "",
    time: item.time || "",
    location: item.location || "",
  });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-xl space-y-3 border border-[var(--border-color)]">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Title"><Input value={form.title} onChange={set("title")} /></Field>
        <Field label="Club / Organizer"><Input value={form.club} onChange={set("club")} /></Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={set("date")} /></Field>
        <Field label="Time"><Input type="time" value={form.time} onChange={set("time")} /></Field>
        <Field label="Location" ><Input value={form.location} onChange={set("location")} /></Field>
      </div>
      <Field label="Description"><Textarea rows={3} value={form.description} onChange={set("description")} /></Field>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition">Cancel</button>
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
          <Save size={14} />{saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

const LostFoundEditForm = ({ item, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    type: item.type || "lost",
    item: item.item || "",
    description: item.description || "",
    location: item.location || "",
    contact: item.contact || "",
    status: item.status || "active",
  });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    // lostFound API expects FormData
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    onSave(fd);
  };

  return (
    <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-xl space-y-3 border border-[var(--border-color)]">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={form.type} onChange={set("type")} options={[{ value: "lost", label: "Lost" }, { value: "found", label: "Found" }]} />
        </Field>
        <Field label="Item Name"><Input value={form.item} onChange={set("item")} /></Field>
        <Field label="Location"><Input value={form.location} onChange={set("location")} /></Field>
        <Field label="Contact"><Input value={form.contact} onChange={set("contact")} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={set("status")} options={[{ value: "active", label: "Active" }, { value: "resolved", label: "Resolved" }]} />
        </Field>
      </div>
      <Field label="Description"><Textarea rows={3} value={form.description} onChange={set("description")} /></Field>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
          <Save size={14} />{saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ITEM CARD — generic wrapper
// ═══════════════════════════════════════════════════════════════
const ItemCard = ({ title, meta, badges, date, onDelete, editForm, expanded, onToggle }) => (
  <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden transition hover:shadow-lg hover:-translate-y-0.5">
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[var(--text-main)] truncate">{title}</h3>
          {meta && <p className="text-sm text-[var(--text-muted)] mt-0.5 line-clamp-2">{meta}</p>}
          {badges?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {badges.map((b, i) => <Badge key={i} color={b.color}>{b.label}</Badge>)}
            </div>
          )}
        </div>
        {/* Right */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xs text-[var(--text-muted)]">{date}</span>
          <div className="flex gap-1">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition"
              title={expanded ? "Close edit" : "Edit"}
            >
              {expanded ? <ChevronUp size={16} /> : <Edit3 size={16} />}
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
      {expanded && editForm}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: "resources",     label: "Resources",     icon: FileText,   color: "blue"   },
  { id: "announcements", label: "Announcements",  icon: Megaphone,  color: "purple" },
  { id: "events",        label: "Events",         icon: Calendar,   color: "green"  },
  { id: "lostfound",     label: "Lost & Found",   icon: Package,    color: "orange" },
];

const MyUploads = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [activeTab, setActiveTab]     = useState("resources");
  const [resources, setResources]     = useState([]);
  const [announcements, setAnn]       = useState([]);
  const [events, setEvents]           = useState([]);
  const [lostFound, setLostFound]     = useState([]);
  const [loading, setLoading]         = useState(true);

  const [editingId, setEditingId]     = useState(null);
  const [saving, setSaving]           = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [res, ann, evt, lf] = await Promise.all([
        resourceService.getMyUploads(),
        announcementService.getMine(),
        eventService.getMine(),
        lostFoundService.getMine(),
      ]);
      setResources(res.data.resources   || []);
      setAnn(ann.data.announcements      || []);
      setEvents(evt.data.events          || []);
      setLostFound(lf.data.items         || []);
    } catch {
      toast.error("Failed to load your uploads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh when a background upload finishes
  useEffect(() => {
    const onUploaded = () => fetchAll();
    window.addEventListener("resource:uploaded", onUploaded);
    return () => window.removeEventListener("resource:uploaded", onUploaded);
  }, [fetchAll]);

  // ── delete helper ────────────────────────────────────────────
  const askDelete = async ({ kind, title, onConfirm }) => {
    const ok = await confirm({
      title: `Delete ${kind}?`,
      message: `"${title}" will be permanently removed. This cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await onConfirm();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${kind}`);
    }
  };

  // ── save helpers ─────────────────────────────────────────────
  const saveResource = async (id, data) => {
    setSaving(true);
    try {
      await resourceService.update(id, data);
      toast.success("Resource updated", { description: data.title });
      setEditingId(null);
      fetchAll();
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update resource"); }
    finally { setSaving(false); }
  };

  const saveAnnouncement = async (id, data) => {
    setSaving(true);
    try {
      await announcementService.update(id, data);
      toast.success("Announcement updated", { description: data.title });
      setEditingId(null);
      fetchAll();
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update announcement"); }
    finally { setSaving(false); }
  };

  const saveEvent = async (id, data) => {
    setSaving(true);
    try {
      await eventService.update(id, data);
      toast.success("Event updated", { description: data.title });
      setEditingId(null);
      fetchAll();
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update event"); }
    finally { setSaving(false); }
  };

  const saveLostFound = async (id, formData) => {
    setSaving(true);
    try {
      await lostFoundService.update(id, formData);
      toast.success("Item updated", { description: formData.get?.("item") || undefined });
      setEditingId(null);
      fetchAll();
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update item"); }
    finally { setSaving(false); }
  };

  // ── counts for tab badges ────────────────────────────────────
  const counts = { resources: resources.length, announcements: announcements.length, events: events.length, lostfound: lostFound.length };

  // ── render tabs ──────────────────────────────────────────────
  const renderResources = () =>
    resources.length === 0 ? (
      <EmptyState
        icon={Upload}
        title="No uploads yet"
        hint="Share your notes, past papers and study materials with the campus."
        actionLabel="Upload a resource"
        onAction={() => navigate("/upload-resource")}
      />
    ) :
    resources.map((r) => (
      <ItemCard
        key={r._id}
        title={r.title}
        meta={r.description}
        badges={[
          r.rejectionReason
            ? { label: "Rejected", color: "red" }
            : !r.approved
            ? { label: "Under review", color: "amber" }
            : { label: "Published", color: "green" },
          { label: r.course,      color: "blue"   },
          { label: r.department,  color: "green"  },
          { label: r.semester ? `${r.semester} Sem` : null, color: "purple" },
          { label: r.fileType,    color: "gray"   },
        ].filter((b) => b.label)}
        date={`Uploaded ${fmtDate(r.createdAt)}`}
        expanded={editingId === r._id}
        onToggle={() => setEditingId(editingId === r._id ? null : r._id)}
        onDelete={() =>
          askDelete({
            kind: "upload",
            title: r.title,
            onConfirm: async () => {
              await resourceService.delete(r._id);
              toast.success("Resource deleted", { description: r.title });
              fetchAll();
            },
          })
        }
        editForm={
          <ResourceEditForm
            item={r}
            saving={saving}
            onCancel={() => setEditingId(null)}
            onSave={(data) => saveResource(r._id, data)}
          />
        }
      />
    ));

  const renderAnnouncements = () =>
    announcements.length === 0 ? (
      <EmptyState
        icon={Megaphone}
        title="No announcements yet"
        hint="Announcements you post will show up here so you can edit or remove them."
      />
    ) :
    announcements.map((a) => (
      <ItemCard
        key={a._id}
        title={a.title}
        meta={a.content}
        badges={[{ label: a.department || "All", color: "purple" }]}
        date={fmtDate(a.createdAt)}
        expanded={editingId === a._id}
        onToggle={() => setEditingId(editingId === a._id ? null : a._id)}
        onDelete={() =>
          askDelete({
            kind: "announcement",
            title: a.title,
            onConfirm: async () => {
              await announcementService.delete(a._id);
              toast.success("Announcement deleted", { description: a.title });
              fetchAll();
            },
          })
        }
        editForm={
          <AnnouncementEditForm
            item={a}
            saving={saving}
            onCancel={() => setEditingId(null)}
            onSave={(data) => saveAnnouncement(a._id, data)}
          />
        }
      />
    ));

  const renderEvents = () =>
    events.length === 0 ? (
      <EmptyState
        icon={Calendar}
        title="No events yet"
        hint="Events you create will show up here so you can edit or remove them."
      />
    ) :
    events.map((e) => (
      <ItemCard
        key={e._id}
        title={e.title}
        meta={e.description}
        badges={[
          { label: e.club,     color: "green" },
          { label: e.location, color: "blue"  },
          { label: e.date ? `📅 ${fmtDate(e.date)}` : null, color: "orange" },
        ].filter((b) => b.label)}
        date={`Created ${fmtDate(e.createdAt)}`}
        expanded={editingId === e._id}
        onToggle={() => setEditingId(editingId === e._id ? null : e._id)}
        onDelete={() =>
          askDelete({
            kind: "event",
            title: e.title,
            onConfirm: async () => {
              await eventService.delete(e._id);
              toast.success("Event deleted", { description: e.title });
              fetchAll();
            },
          })
        }
        editForm={
          <EventEditForm
            item={e}
            saving={saving}
            onCancel={() => setEditingId(null)}
            onSave={(data) => saveEvent(e._id, data)}
          />
        }
      />
    ));

  const renderLostFound = () =>
    lostFound.length === 0 ? (
      <EmptyState
        icon={Package}
        title="No lost & found posts yet"
        hint="Items you report on the Lost & Found board will show up here."
      />
    ) :
    lostFound.map((lf) => (
      <ItemCard
        key={lf._id}
        title={lf.item}
        meta={lf.description}
        badges={[
          { label: lf.type?.toUpperCase(), color: lf.type === "lost" ? "red" : "green" },
          { label: lf.location, color: "blue" },
          { label: lf.status,   color: lf.status === "resolved" ? "gray" : "orange" },
        ]}
        date={fmtDate(lf.createdAt)}
        expanded={editingId === lf._id}
        onToggle={() => setEditingId(editingId === lf._id ? null : lf._id)}
        onDelete={() =>
          askDelete({
            kind: "item",
            title: lf.item,
            onConfirm: async () => {
              await lostFoundService.delete(lf._id);
              toast.success("Item deleted", { description: lf.item });
              fetchAll();
            },
          })
        }
        editForm={
          <LostFoundEditForm
            item={lf}
            saving={saving}
            onCancel={() => setEditingId(null)}
            onSave={(fd) => saveLostFound(lf._id, fd)}
          />
        }
      />
    ));

  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <FolderOpen size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-main)]">My Uploads</h2>
            <p className="text-[var(--text-muted)] mt-1">Manage everything you've posted</p>
          </div>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setEditingId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              activeTab === id
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {React.createElement(Icon, { size: 15 })}
            {label}
            {counts[id] > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === id ? "bg-white/25 text-white" : BADGE_STYLES[color] || BADGE_STYLES.blue
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonRow count={5} />
      ) : (
        <div className="space-y-3">
          {activeTab === "resources"     && renderResources()}
          {activeTab === "announcements" && renderAnnouncements()}
          {activeTab === "events"        && renderEvents()}
          {activeTab === "lostfound"     && renderLostFound()}
        </div>
      )}
    </div>
  );
};

export default MyUploads;
