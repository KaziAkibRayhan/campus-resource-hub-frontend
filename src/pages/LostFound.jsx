import React, { useCallback, useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { Formik, Form, Field, ErrorMessage } from "formik";
import {
  Check,
  CheckCircle,
  Clock,
  Image,
  Lock,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { lostFoundService } from "../services/api";
import { lostFoundSchema } from "../utils/validationSchemas";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import useHighlight from "../hooks/useHighlight";
import { useConfirm } from "../components/common/ConfirmDialog";
import { SkeletonGrid } from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";

const PAGE_SIZE = 12;

const statusStyles = {
  open: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  claimed: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  resolved: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
};

const LostFound = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  useHighlight(!loading);
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [claimTarget, setClaimTarget] = useState(null);
  const [claimNote, setClaimNote] = useState("");
  const [busyId, setBusyId] = useState(null);

  const canManage = user?.role === "admin" || user?.role === "moderator";

  const fetchItems = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const params = { page: targetPage, limit: PAGE_SIZE };
        if (filter !== "all") params.type = filter;
        if (debouncedSearch) params.search = debouncedSearch;
        if (mineOnly) params.mine = true;

        const response = await lostFoundService.getAll(params);
        const fetched = response.data.items || [];
        setTotalPages(response.data.totalPages || 1);
        setPage(response.data.currentPage || targetPage);
        setItems((prev) => (append ? [...prev, ...fetched] : fetched));
      } catch (error) {
        console.error("Lost found fetch error:", error);
        toast.error(error.response?.data?.message || "Failed to fetch items");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [filter, debouncedSearch, mineOnly]
  );

  useEffect(() => {
    fetchItems(1, false);
  }, [fetchItems]);

  // Realtime: keep cards in sync with claim/status changes.
  useEffect(() => {
    if (!socket) return;

    const upsert = (updatedItem) =>
      setItems((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? { ...item, ...updatedItem } : item))
      );
    const remove = ({ _id }) =>
      setItems((prev) => prev.filter((item) => item._id !== _id));
    const refresh = () => fetchItems(1, false);

    socket.on("lostfound:updated", upsert);
    socket.on("lostfound:deleted", remove);
    socket.on("lostfound:new", refresh);
    return () => {
      socket.off("lostfound:updated", upsert);
      socket.off("lostfound:deleted", remove);
      socket.off("lostfound:new", refresh);
    };
  }, [socket, fetchItems]);

  const replaceItem = (updated) =>
    setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("type", values.type);
      formData.append("item", values.item);
      formData.append("description", values.description);
      formData.append("location", values.location);
      formData.append("contact", values.contact);
      formData.append("contactVisibility", values.contactVisibility);
      if (values.image) formData.append("image", values.image);

      const response = await lostFoundService.create(formData);
      if (response.data.code === "UNDER_REVIEW") {
        toast.info(response.data.message);
      } else {
        toast.success(response.data.message);
      }
      resetForm();
      setSelectedImage(null);
      setShowForm(false);
      fetchItems(1, false);
    } catch (error) {
      console.error("Lost found submit error:", error);
      const data = error.response?.data;
      toast.error(
        data?.code === "CONTENT_REJECTED"
          ? data.message
          : data?.message || "Failed to submit item"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitClaim = async () => {
    if (!claimTarget) return;
    try {
      setBusyId(claimTarget._id);
      const res = await lostFoundService.claim(claimTarget._id, claimNote.trim());
      toast.success(res.data.message || "Claim submitted", { description: claimTarget.item });
      replaceItem(res.data.item);
      setClaimTarget(null);
      setClaimNote("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit claim");
    } finally {
      setBusyId(null);
    }
  };

  const runAction = async (id, fn, label, itemName) => {
    try {
      setBusyId(id);
      const res = await fn();
      if (res.data.item) replaceItem(res.data.item);
      toast.success(
        res.data.message || `${label} done`,
        itemName ? { description: itemName } : undefined
      );
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${label.toLowerCase()}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (item) => {
    const ok = await confirm({
      title: "Mark item as returned?",
      message: `"${item.item}" will be marked resolved and closed to new claims.`,
      confirmText: "Mark returned",
      variant: "success",
    });
    if (!ok) return;
    runAction(item._id, () => lostFoundService.resolve(item._id), "Resolve", item.item);
  };

  const handleDecideClaim = async (item, claim, decision) => {
    const approve = decision === "approve";
    const claimant = claim.user?.name || "This student";
    const ok = await confirm({
      title: approve ? "Approve claim?" : "Decline claim?",
      message: approve
        ? `${claimant}'s claim on "${item.item}" will be approved and your contact details shared with them.`
        : `${claimant}'s claim on "${item.item}" will be declined.`,
      confirmText: approve ? "Approve" : "Decline",
      variant: approve ? "success" : "danger",
    });
    if (!ok) return;
    runAction(
      item._id,
      () => lostFoundService.decideClaim(item._id, claim._id, decision),
      approve ? "Approve claim" : "Decline claim",
      item.item
    );
  };

  const isOwner = (item) => user && item.postedBy?._id === user._id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-main)]">Lost & Found</h2>
            <p className="text-[var(--text-muted)] mt-1">Help find or return lost items</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition flex items-center space-x-2 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        >
          <Plus size={20} />
          <span>Report Item</span>
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 border border-[var(--border-color)]">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "lost", "found"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                  filter === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] border border-[var(--border-color)]"
                }`}
              >
                {type === "all" ? "All Items" : type.toUpperCase()}
              </button>
            ))}
            {user && (
              <button
                onClick={() => setMineOnly((v) => !v)}
                className={`px-4 py-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
                  mineOnly
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] border border-[var(--border-color)]"
                }`}
              >
                My Posts
              </button>
            )}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-3 text-[var(--text-muted)]" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={6} media lines={2} className="grid md:grid-cols-2 gap-6" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items found"
          hint={
            search || filter !== "all" || mineOnly
              ? "Try adjusting your search or filters."
              : "There are no lost or found items at the moment. Be the first to report one."
          }
          actionLabel={user ? "Report an item" : undefined}
          onAction={user ? () => setShowForm(true) : undefined}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((item) => {
              const owner = isOwner(item);
              const pendingClaims = (item.claims || []).filter((c) => c.status === "pending");
              const canClaim =
                user &&
                !owner &&
                item.status === "open" &&
                (!item.myClaim || item.myClaim.status === "rejected");
              const busy = busyId === item._id;

              return (
                <div
                  id={`hl-${item._id}`}
                  key={item._id}
                  className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 transition hover:shadow-lg hover:-translate-y-0.5 border border-[var(--border-color)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.type === "lost"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-green-500/10 text-green-500 border border-green-500/20"
                        }`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          statusStyles[item.status] || statusStyles.open
                        }`}
                      >
                        {item.status}
                      </span>
                      {!item.approved && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                          <Clock size={12} />
                          {item.rejectionReason ? "Rejected" : "Under review"}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 bg-[var(--bg-secondary)] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.item} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="text-[var(--text-muted)] opacity-50" size={32} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">{item.item}</h3>
                      <p className="text-[var(--text-muted)] text-sm mb-3">{item.description}</p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                          <MapPin size={16} className="text-orange-500" />
                          <span>
                            <span className="font-medium text-[var(--text-main)]">Location:</span>{" "}
                            {item.location}
                          </span>
                        </div>
                        {item.contact ? (
                          <div className="text-[var(--text-muted)]">
                            <span className="font-medium text-[var(--text-main)]">Contact:</span>{" "}
                            {item.contact}
                          </div>
                        ) : item.contactLocked ? (
                          <div className="text-[var(--text-muted)] flex items-center gap-1.5">
                            <Lock size={14} />
                            <span>
                              Contact hidden —{" "}
                              {item.status === "open"
                                ? "claim this item to request it"
                                : "shared with the matched claimant"}
                            </span>
                          </div>
                        ) : null}
                        <div className="text-[var(--text-muted)] italic opacity-75">
                          Posted by {item.postedBy?.name || "Student"}
                          {item.claimedBy?.name && (
                            <> · Claimed by {item.claimedBy.name}</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Viewer's own claim status */}
                  {item.myClaim && (
                    <div
                      className={`mt-4 text-sm rounded-lg px-3 py-2 ${
                        item.myClaim.status === "approved"
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                          : item.myClaim.status === "rejected"
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                          : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {item.myClaim.status === "approved"
                        ? "✓ Your claim was approved — contact details are visible above."
                        : item.myClaim.status === "rejected"
                        ? "Your claim was declined."
                        : "⏳ Your claim is pending the poster's review."}
                    </div>
                  )}

                  {/* Owner / moderator: pending claims to decide */}
                  {(owner || canManage) && pendingClaims.length > 0 && (
                    <div className="mt-4 border-t border-[var(--border-color)] pt-3 space-y-2">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                        Pending claims ({pendingClaims.length})
                      </p>
                      {pendingClaims.map((claim) => (
                        <div
                          key={claim._id}
                          className="flex items-start justify-between gap-2 text-sm bg-[var(--bg-secondary)] rounded-lg px-3 py-2"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-[var(--text-main)]">
                              {claim.user?.name || "Student"}
                            </span>
                            {claim.note && (
                              <p className="text-[var(--text-muted)] truncate">“{claim.note}”</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              disabled={busy}
                              onClick={() => handleDecideClaim(item, claim, "approve")}
                              className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                              title="Approve claim"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => handleDecideClaim(item, claim, "reject")}
                              className="p-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] disabled:opacity-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                              title="Decline claim"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canClaim && (
                      <button
                        disabled={busy}
                        onClick={() => {
                          setClaimTarget(item);
                          setClaimNote("");
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      >
                        <UserCheck size={16} />
                        {item.type === "lost" ? "I found this" : "This is mine"}
                      </button>
                    )}
                    {(owner || canManage) && item.status !== "resolved" && (
                      <button
                        disabled={busy}
                        onClick={() => handleResolve(item)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                      >
                        <CheckCircle size={16} />
                        Mark returned
                      </button>
                    )}
                    {(owner || canManage) && item.status !== "open" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          runAction(item._id, () => lostFoundService.reopen(item._id), "Reopen", item.item)
                        }
                        className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] text-sm font-medium hover:bg-[var(--bg-hover)] border border-[var(--border-color)] disabled:opacity-50 flex items-center gap-1.5 transition"
                      >
                        <RotateCcw size={16} />
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!mineOnly && page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchItems(page + 1, true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Claim modal */}
      {claimTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--border-color)]">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                Claim “{claimTarget.item}”
              </h3>
              <button
                onClick={() => setClaimTarget(null)}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                Add a short note to help the poster confirm it's a match (e.g. a detail only the
                owner would know). The poster reviews and approves your claim.
              </p>
              <textarea
                value={claimNote}
                onChange={(e) => setClaimNote(e.target.value)}
                rows="3"
                maxLength={300}
                placeholder="Optional note..."
                className="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)]"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setClaimTarget(null)}
                  className="px-5 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={submitClaim}
                  disabled={busyId === claimTarget._id}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:opacity-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  Submit claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)]">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">Report Item</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Posts are safety-checked; anything flagged is reviewed before appearing.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition text-[var(--text-muted)]"
              >
                <X size={22} />
              </button>
            </div>
            <Formik
              initialValues={{
                type: "lost",
                item: "",
                description: "",
                location: "",
                contact: "",
                contactVisibility: "on-request",
                image: null,
              }}
              validationSchema={lostFoundSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                        Type
                      </label>
                      <Field as="select" name="type" className="w-full px-4 py-3">
                        <option value="lost">Lost</option>
                        <option value="found">Found</option>
                      </Field>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                        Item Name
                      </label>
                      <Field name="item" className="w-full px-4 py-3" />
                      <ErrorMessage name="item" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                      Description
                    </label>
                    <Field as="textarea" name="description" rows="3" className="w-full px-4 py-3" />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                        Location
                      </label>
                      <Field name="location" className="w-full px-4 py-3" />
                      <ErrorMessage
                        name="location"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                        Contact
                      </label>
                      <Field name="contact" className="w-full px-4 py-3" />
                      <ErrorMessage
                        name="contact"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                      Who can see your contact?
                    </label>
                    <Field as="select" name="contactVisibility" className="w-full px-4 py-3">
                      <option value="on-request">
                        Only matched claimants (recommended)
                      </option>
                      <option value="public">Everyone</option>
                    </Field>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      "Only matched claimants" hides your contact until you approve someone's claim.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                      Image
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.currentTarget.files[0];
                        setFieldValue("image", file);
                        setSelectedImage(file);
                      }}
                      className="w-full px-4 py-3 border rounded-lg bg-[var(--bg-input)] text-[var(--text-main)] border-[var(--border-color)]"
                    />
                    {selectedImage && (
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        Selected: {selectedImage.name}
                      </p>
                    )}
                    <ErrorMessage name="image" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 shadow-md transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFound;
