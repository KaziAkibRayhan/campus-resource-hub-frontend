import React, { useCallback, useEffect, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import {
  Users,
  Plus,
  Search,
  X,
  Crown,
  Shield,
  UserMinus,
  Check,
  Calendar,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { clubService } from "../services/api";
import useHighlight from "../hooks/useHighlight";
import { useConfirm } from "../components/common/ConfirmDialog";
import { SkeletonGrid } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { isCanceledRequest } from "../utils/request";

const PAGE_SIZE = 12;

const Clubs = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const confirm = useConfirm();
  const [clubs, setClubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  useHighlight(!loading);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    joinPolicy: "open",
  });
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null); // { club, events }
  const [detailLoading, setDetailLoading] = useState(false);
  const listRequestRef = useRef(null);

  const canManage = user?.role === "admin" || user?.role === "moderator";

  const fetchClubs = useCallback(
    async (targetPage = 1, append = false) => {
      const controller = new AbortController();
      listRequestRef.current?.abort();
      listRequestRef.current = controller;
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const params = { page: targetPage, limit: PAGE_SIZE };
        if (debouncedSearch) params.search = debouncedSearch;
        if (categoryFilter !== "all") params.category = categoryFilter;
        const response = await clubService.getAll(params, { signal: controller.signal });
        const fetched = response.data.clubs || [];
        setCategories(response.data.categories || []);
        setTotalPages(response.data.totalPages || 1);
        setPage(response.data.currentPage || targetPage);
        setClubs((prev) => (append ? [...prev, ...fetched] : fetched));
      } catch (error) {
        if (isCanceledRequest(error)) return;
        console.error("Clubs fetch error:", error);
        toast.error(error.response?.data?.message || "Failed to fetch clubs");
      } finally {
        if (listRequestRef.current === controller) {
          append ? setLoadingMore(false) : setLoading(false);
        }
      }
    },
    [debouncedSearch, categoryFilter]
  );

  useEffect(() => {
    fetchClubs(1, false);
    return () => listRequestRef.current?.abort();
  }, [fetchClubs]);

  useEffect(() => {
    if (!socket) return;
    const patch = (payload) => {
      const id = payload.clubId || payload._id;
      setClubs((prev) => prev.map((c) => (c._id === id ? { ...c, ...payload, _id: c._id } : c)));
    };
    const refresh = () => fetchClubs(1, false);
    const remove = ({ _id }) => setClubs((prev) => prev.filter((c) => c._id !== _id));
    socket.on("club:updated", patch);
    socket.on("club:new", refresh);
    socket.on("club:deleted", remove);
    return () => {
      socket.off("club:updated", patch);
      socket.off("club:new", refresh);
      socket.off("club:deleted", remove);
    };
  }, [socket, fetchClubs]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await clubService.create(form);
      toast.success("Club created");
      setForm({ name: "", category: "", description: "", joinPolicy: "open" });
      setShowCreate(false);
      fetchClubs(1, false);
    } catch (error) {
      const data = error.response?.data;
      toast.error(data?.code === "CONTENT_REJECTED" ? data.message : data?.message || "Failed to create club");
    }
  };

  const replaceClub = (updated) =>
    setClubs((prev) => prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)));

  const handleMembership = async (club) => {
    if (club.isMember) {
      const ok = await confirm({
        title: "Leave club?",
        message: `You'll no longer be a member of "${club.name}". You can rejoin later${
          club.joinPolicy === "request" ? ", but officers will need to approve you again" : ""
        }.`,
        confirmText: "Leave club",
        variant: "warning",
      });
      if (!ok) return;
    }
    try {
      setBusyId(club._id);
      if (club.isMember) {
        const res = await clubService.leave(club._id);
        toast.success("Left club", {
          description: `You are no longer a member of "${club.name}".`,
        });
        replaceClub(res.data.club);
      } else if (club.hasRequested) {
        toast.info("Your join request is already pending");
      } else {
        const res = await clubService.join(club._id);
        toast.success(res.data.message || "Membership updated");
        replaceClub(res.data.club);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update membership");
    } finally {
      setBusyId(null);
    }
  };

  const openDetail = async (clubId) => {
    try {
      setDetailLoading(true);
      setDetail({ club: { _id: clubId }, events: [] });
      const res = await clubService.getById(clubId);
      setDetail({ club: res.data.club, events: res.data.events || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load club");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = (updatedClub) => {
    setDetail((prev) => (prev ? { ...prev, club: updatedClub } : prev));
    replaceClub(updatedClub);
  };

  const membershipLabel = (club) => {
    if (club.isMember) return "Leave Club";
    if (club.hasRequested) return "Requested";
    return club.joinPolicy === "request" ? "Request to Join" : "Join Club";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-main)]">Campus Clubs</h2>
            <p className="text-[var(--text-muted)] mt-1">Explore and join student organizations</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate((value) => !value)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <Plus size={20} />
            Create Club
          </button>
        )}
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 border border-[var(--border-color)] flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 lg:flex-1 lg:min-w-0">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                categoryFilter === cat ? "bg-blue-600 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72 lg:flex-shrink-0">
          <Search className="absolute left-3 top-3 text-[var(--text-muted)]" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clubs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 space-y-4 border border-[var(--border-color)]"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Club name"
              className="px-4 py-3"
              required
            />
            <input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="Category (e.g. Sports, Tech)"
              className="px-4 py-3"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Description"
            rows="3"
            className="w-full px-4 py-3"
            required
          />
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              Join policy
            </label>
            <select
              value={form.joinPolicy}
              onChange={(event) => setForm({ ...form, joinPolicy: event.target.value })}
              className="w-full px-4 py-3"
            >
              <option value="open">Open — anyone can join instantly</option>
              <option value="request">Request — officers approve each member</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-5 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
            >
              Save Club
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <SkeletonGrid
          count={8}
          lines={3}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        />
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clubs found"
          hint={
            debouncedSearch || categoryFilter !== "all"
              ? "Try a different search or category filter."
              : "Clubs created by admins or moderators will appear here."
          }
          actionLabel={canManage ? "Create club" : undefined}
          onAction={canManage ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {clubs.map((club) => (
              <div
                id={`hl-${club._id}`}
                key={club._id}
                className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 transition hover:shadow-lg hover:-translate-y-0.5 border border-[var(--border-color)] flex flex-col"
              >
                <div className="w-16 h-16 bg-blue-600/10 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 mx-auto relative">
                  <Users size={32} className="text-blue-600 dark:text-blue-400" />
                  {club.isOfficer && club.pendingRequestCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {club.pendingRequestCount}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-[var(--text-main)] text-center mb-1">
                  {club.name}
                </h3>
                <p className="text-[var(--text-muted)] text-center text-xs uppercase tracking-wide mb-2">
                  {club.category || "General"}
                  {club.joinPolicy === "request" && " · approval"}
                </p>
                <p className="text-[var(--text-muted)] text-center text-sm mb-4 min-h-12 line-clamp-3">
                  {club.description}
                </p>
                <div className="text-center pt-4 border-t border-[var(--border-color)] mt-auto">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {club.memberCount}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Members</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleMembership(club)}
                    disabled={busyId === club._id || (club.hasRequested && !club.isMember)}
                    className={`flex-1 py-2 rounded-lg transition font-medium text-sm disabled:opacity-60 ${
                      club.isMember
                        ? "bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    }`}
                  >
                    {membershipLabel(club)}
                  </button>
                  <button
                    onClick={() => openDetail(club._id)}
                    className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
                    title="View club"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchClubs(page + 1, true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {detail && (
        <ClubDetailModal
          detail={detail}
          loading={detailLoading}
          onClose={() => setDetail(null)}
          onChanged={refreshDetail}
        />
      )}
    </div>
  );
};

// ── Club detail / management modal ────────────────────────────────
const ClubDetailModal = ({ detail, loading, onClose, onChanged }) => {
  const { club, events } = detail;
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const act = async (fn, okMsg) => {
    try {
      setBusy(true);
      const res = await fn();
      if (res.data.club) onChanged(res.data.club);
      if (okMsg) toast.success(okMsg);
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)]">
        <div className="p-6 border-b border-[var(--border-color)] flex items-start justify-between sticky top-0 bg-[var(--bg-card)] z-10">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">{club.name}</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {club.category || "General"} · {club.memberCount ?? club.members?.length ?? 0} members
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]"
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <p className="text-[var(--text-muted)] text-sm">{club.description}</p>

            {/* Join requests (officers) */}
            {club.isOfficer && club.joinRequests?.length > 0 && (
              <div>
                <h4 className="font-semibold text-[var(--text-main)] mb-2">
                  Join requests ({club.joinRequests.length})
                </h4>
                <div className="space-y-2">
                  {club.joinRequests.map((r) => (
                    <div
                      key={r.user?._id || r.user}
                      className="flex items-center justify-between gap-2 bg-[var(--bg-secondary)] rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-main)]">
                          {r.user?.name || "Student"}
                        </p>
                        {r.note && <p className="text-xs text-[var(--text-muted)] truncate">“{r.note}”</p>}
                      </div>
                      <div className="flex gap-1">
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => clubService.decideRequest(club._id, r.user?._id || r.user, "approve"),
                              "Member added"
                            )
                          }
                          className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          disabled={busy}
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Reject join request?",
                              message: `${r.user?.name || "This student"}'s request to join "${club.name}" will be declined.`,
                              confirmText: "Reject",
                              variant: "danger",
                            });
                            if (!ok) return;
                            act(
                              () => clubService.decideRequest(club._id, r.user?._id || r.user, "reject"),
                              "Request declined"
                            );
                          }}
                          className="p-1.5 rounded-md bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            {club.members && (
              <div>
                <h4 className="font-semibold text-[var(--text-main)] mb-2">Members</h4>
                <div className="space-y-2">
                  {club.members.map((m) => {
                    const memberId = m.user?._id || m.user;
                    const isCreator = (club.createdBy?._id || club.createdBy) === memberId;
                    return (
                      <div
                        key={memberId}
                        className="flex items-center justify-between gap-2 bg-[var(--bg-secondary)] rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isCreator ? (
                            <Crown size={15} className="text-amber-500 flex-shrink-0" />
                          ) : m.role === "officer" ? (
                            <Shield size={15} className="text-blue-500 flex-shrink-0" />
                          ) : null}
                          <span className="text-sm text-[var(--text-main)] truncate">
                            {m.user?.name || "Student"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            {isCreator ? "creator" : m.role}
                          </span>
                        </div>
                        {club.isOfficer && !isCreator && (
                          <div className="flex gap-1">
                            <button
                              disabled={busy}
                              onClick={() =>
                                act(
                                  () =>
                                    clubService.setRole(
                                      club._id,
                                      memberId,
                                      m.role === "officer" ? "member" : "officer"
                                    ),
                                  "Role updated"
                                )
                              }
                              className="px-2 py-1 rounded-md text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {m.role === "officer" ? "Demote" : "Make officer"}
                            </button>
                            <button
                              disabled={busy}
                              onClick={async () => {
                                const ok = await confirm({
                                  title: "Remove member?",
                                  message: `${m.user?.name || "This student"} will be removed from "${club.name}".`,
                                  confirmText: "Remove",
                                  variant: "danger",
                                });
                                if (!ok) return;
                                act(() => clubService.removeMember(club._id, memberId), "Member removed");
                              }}
                              className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 disabled:opacity-50"
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming events */}
            <div>
              <h4 className="font-semibold text-[var(--text-main)] mb-2 flex items-center gap-1.5">
                <Calendar size={16} /> Upcoming events
              </h4>
              {events.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No upcoming events for this club.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => (
                    <div key={e._id} className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-[var(--text-main)]">{e.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(e.date).toLocaleDateString()} · {e.time} · {e.location}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {club.isOwner && (
              <div className="pt-2 border-t border-[var(--border-color)]">
                <button
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete club?",
                      message: `"${club.name}" and its membership list will be permanently removed. This cannot be undone.`,
                      confirmText: "Delete",
                      variant: "danger",
                    });
                    if (!ok) return;
                    try {
                      setBusy(true);
                      await clubService.delete(club._id);
                      toast.success("Club deleted", {
                        description: `"${club.name}" has been removed.`,
                      });
                      onClose();
                    } catch (error) {
                      toast.error(error.response?.data?.message || "Failed to delete");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 text-sm font-medium disabled:opacity-50"
                >
                  <Trash2 size={15} /> Delete club
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;
