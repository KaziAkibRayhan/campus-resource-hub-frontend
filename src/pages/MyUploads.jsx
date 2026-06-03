// src/pages/MyUploads.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  FileText, Megaphone, Calendar, Package,
  Edit3, Trash2, RefreshCw, X, Save,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  resourceService,
  announcementService,
  eventService,
  lostFoundService,
} from "../services/api";
import { departments, semesters } from "../utils/constants";

// ── tiny helpers ────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

const Badge = ({ children, color = "blue" }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300`}>
    {children}
  </span>
);

// ── Confirm-delete modal ─────────────────────────────────────────
const DeleteModal = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-[var(--border-color)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <div>
          <h3 className="font-bold text-[var(--text-main)]">Delete?</h3>
          <p className="text-xs text-[var(--text-muted)]">This cannot be undone.</p>
        </div>
      </div>
      <p className="text-sm text-[var(--text-main)] mb-5">
        Delete <strong>{label}</strong>?
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 bg-[var(--bg-secondary)] rounded-xl text-sm font-medium hover:bg-[var(--bg-hover)] transition">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition">Delete</button>
      </div>
    </div>
  </div>
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
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1">
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
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1">
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
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1">
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
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1">
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
  <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
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
  const [activeTab, setActiveTab]     = useState("resources");
  const [resources, setResources]     = useState([]);
  const [announcements, setAnn]       = useState([]);
  const [events, setEvents]           = useState([]);
  const [lostFound, setLostFound]     = useState([]);
  const [loading, setLoading]         = useState(true);

  const [editingId, setEditingId]     = useState(null);
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, label, onConfirm }

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

  // ── delete helper ────────────────────────────────────────────
  const askDelete = (label, onConfirm) => setDeleteTarget({ label, onConfirm });

  // ── save helpers ─────────────────────────────────────────────
  const saveResource = async (id, data) => {
    setSaving(true);
    try {
      await resourceService.update(id, data);
      toast.success("Resource updated");
      setEditingId(null);
      fetchAll();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const saveAnnouncement = async (id, data) => {
    setSaving(true);
    try {
      await announcementService.update(id, data);
      toast.success("Announcement updated");
      setEditingId(null);
      fetchAll();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const saveEvent = async (id, data) => {
    setSaving(true);
    try {
      await eventService.update(id, data);
      toast.success("Event updated");
      setEditingId(null);
      fetchAll();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const saveLostFound = async (id, formData) => {
    setSaving(true);
    try {
      await lostFoundService.update(id, formData);
      toast.success("Item updated");
      setEditingId(null);
      fetchAll();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  // ── counts for tab badges ────────────────────────────────────
  const counts = { resources: resources.length, announcements: announcements.length, events: events.length, lostfound: lostFound.length };

  // ── render tabs ──────────────────────────────────────────────
  const renderResources = () =>
    resources.length === 0 ? <Empty label="resources" /> :
    resources.map((r) => (
      <ItemCard
        key={r._id}
        title={r.title}
        meta={r.description}
        badges={[
          { label: r.course,      color: "blue"   },
          { label: r.department,  color: "green"  },
          { label: r.semester ? `${r.semester} Sem` : null, color: "purple" },
          { label: r.fileType,    color: "gray"   },
        ].filter((b) => b.label)}
        date={`Uploaded ${fmtDate(r.createdAt)}`}
        expanded={editingId === r._id}
        onToggle={() => setEditingId(editingId === r._id ? null : r._id)}
        onDelete={() =>
          askDelete(`"${r.title}"`, async () => {
            await resourceService.delete(r._id);
            toast.success("Resource deleted");
            fetchAll();
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
    announcements.length === 0 ? <Empty label="announcements" /> :
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
          askDelete(`"${a.title}"`, async () => {
            await announcementService.delete(a._id);
            toast.success("Announcement deleted");
            fetchAll();
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
    events.length === 0 ? <Empty label="events" /> :
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
          askDelete(`"${e.title}"`, async () => {
            await eventService.delete(e._id);
            toast.success("Event deleted");
            fetchAll();
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
    lostFound.length === 0 ? <Empty label="lost & found items" /> :
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
          askDelete(`"${lf.item}"`, async () => {
            await lostFoundService.delete(lf._id);
            toast.success("Item deleted");
            fetchAll();
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
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">My Uploads</h2>
          <p className="text-[var(--text-muted)] mt-1">Manage everything you've posted</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-hover)] transition disabled:opacity-50 shadow-sm"
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-blue-600 text-white shadow-md"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {React.createElement(Icon, { size: 15 })}
            {label}
            {counts[id] > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === id ? "bg-white/25 text-white" : `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600`
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === "resources"     && renderResources()}
          {activeTab === "announcements" && renderAnnouncements()}
          {activeTab === "events"        && renderEvents()}
          {activeTab === "lostfound"     && renderLostFound()}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.label}
          onConfirm={async () => {
            try { await deleteTarget.onConfirm(); }
            catch { toast.error("Delete failed"); }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

// empty state
const Empty = ({ label }) => (
  <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-12 text-center">
    <p className="text-4xl mb-3">📭</p>
    <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">Nothing here yet</h3>
    <p className="text-sm text-[var(--text-muted)]">You haven't posted any {label} yet.</p>
  </div>
);

export default MyUploads;
