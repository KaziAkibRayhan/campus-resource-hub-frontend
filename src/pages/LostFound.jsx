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

const LostFound = () => {
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
          <h2 className="text-3xl font-bold text-gray-800">Lost & Found</h2>
          <p className="text-gray-600 mt-1">Help find or return lost items</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Report Item</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex space-x-2">
            {["all", "lost", "found"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type === "all" ? "All Items" : type.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, location..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No items found
          </h3>
          <p className="text-gray-600">
            There are no matching lost or found items at the moment.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    item.type === "lost"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.type.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.item}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="text-gray-400" size={32} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {item.item}
                    </h3>
                    {item.status !== "open" && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle size={13} />
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {item.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin size={16} className="text-orange-500" />
                      <span>
                        <span className="font-medium">Location:</span>{" "}
                        {item.location}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">Contact:</span> {item.contact}
                    </div>
                    <div className="text-gray-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Report Item</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Reports are reviewed before appearing publicly.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type
                      </label>
                      <Field
                        as="select"
                        name="type"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="lost">Lost</option>
                        <option value="found">Found</option>
                      </Field>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Item Name
                      </label>
                      <Field
                        name="item"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage
                        name="item"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      rows="3"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Location
                      </label>
                      <Field
                        name="location"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage
                        name="location"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact
                      </label>
                      <Field
                        name="contact"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage
                        name="contact"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                    {selectedImage && (
                      <p className="text-sm text-gray-600 mt-2">
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
                      className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
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
