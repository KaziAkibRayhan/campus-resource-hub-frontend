import React, { useCallback, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import {
  AlertCircle,
  CheckCircle,
  Image,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { lostFoundService } from "../services/api";
import { lostFoundSchema } from "../utils/validationSchemas";
import { useSocket } from "../context/SocketContext";

const LostFound = () => {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== "all") params.type = filter;
      if (search) params.search = search;

      const response = await lostFoundService.getAll(params);
      setItems(response.data.items);
    } catch (error) {
      console.error("Lost found fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Realtime: status changes (open/claimed/resolved) update cards live
  useEffect(() => {
    if (!socket) return;

    const handleItemUpdated = (updatedItem) => {
      setItems((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
      );
    };

    socket.on("lostfound:updated", handleItemUpdated);
    return () => socket.off("lostfound:updated", handleItemUpdated);
  }, [socket]);

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("type", values.type);
      formData.append("item", values.item);
      formData.append("description", values.description);
      formData.append("location", values.location);
      formData.append("contact", values.contact);
      if (values.image) formData.append("image", values.image);

      const response = await lostFoundService.create(formData);
      toast.success(response.data.message);
      resetForm();
      setSelectedImage(null);
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error("Lost found submit error:", error);
      toast.error(error.response?.data?.message || "Failed to submit item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">Lost & Found</h2>
          <p className="text-[var(--text-muted)] mt-1">Help find or return lost items</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition flex items-center space-x-2 shadow-md"
        >
          <Plus size={20} />
          <span>Report Item</span>
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 border border-[var(--border-color)]">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex space-x-2">
            {["all", "lost", "found"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                {type === "all" ? "All Items" : type.toUpperCase()}
              </button>
            ))}
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
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-12 text-center border border-[var(--border-color)]">
          <AlertCircle className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" size={64} />
          <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">
            No items found
          </h3>
          <p className="text-[var(--text-muted)]">
            There are no matching lost or found items at the moment.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 hover:shadow-lg transition border border-[var(--border-color)]"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    item.type === "lost"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  }`}
                >
                  {item.type.toUpperCase()}
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-[var(--bg-secondary)] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.item}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="text-[var(--text-muted)] opacity-50" size={32} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[var(--text-main)]">
                      {item.item}
                    </h3>
                    {item.status !== "open" && (
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle size={13} />
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-muted)] text-sm mb-3">
                    {item.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                      <MapPin size={16} className="text-orange-500" />
                      <span>
                        <span className="font-medium text-[var(--text-main)]">Location:</span>{" "}
                        {item.location}
                      </span>
                    </div>
                    <div className="text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-main)]">Contact:</span> {item.contact}
                    </div>
                    <div className="text-[var(--text-muted)] italic opacity-75">
                      Posted by {item.postedBy?.name || "Student"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)]">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">Report Item</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Reports are reviewed before appearing publicly.
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
                      <Field
                        as="select"
                        name="type"
                        className="w-full px-4 py-3"
                      >
                        <option value="lost">Lost</option>
                        <option value="found">Found</option>
                      </Field>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                        Item Name
                      </label>
                      <Field
                        name="item"
                        className="w-full px-4 py-3"
                      />
                      <ErrorMessage
                        name="item"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                      Description
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      rows="3"
                      className="w-full px-4 py-3"
                    />
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
                      <Field
                        name="location"
                        className="w-full px-4 py-3"
                      />
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
                      <Field
                        name="contact"
                        className="w-full px-4 py-3"
                      />
                      <ErrorMessage
                        name="contact"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
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
                    <ErrorMessage
                      name="image"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
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
                      className="px-5 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 shadow-md transition disabled:opacity-50"
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
