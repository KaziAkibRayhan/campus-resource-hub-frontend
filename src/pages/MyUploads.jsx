import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import {
  CheckCircle,
  Clock,
  Edit,
  FileText,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { resourceService } from "../services/api";
import { departments, semesters } from "../utils/constants";
import { uploadResourceSchema } from "../utils/validationSchemas";

const editResourceSchema = uploadResourceSchema.omit(["file"]);

const MyUploads = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getMyUploads();
      setResources(response.data.resources);
    } catch (error) {
      console.error("My uploads fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch uploads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const getStatus = (resource) => {
    if (resource.approved) {
      return {
        label: "Approved",
        icon: CheckCircle,
        className: "bg-green-100 text-green-700",
      };
    }

    if (resource.rejectionReason) {
      return {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-100 text-red-700",
      };
    }

    return {
      label: "Pending",
      icon: Clock,
      className: "bg-yellow-100 text-yellow-700",
    };
  };

  const handleUpdate = async (values, { setSubmitting }) => {
    try {
      await resourceService.update(editingResource._id, values);
      toast.success("Resource updated and sent for re-approval");
      setEditingResource(null);
      fetchUploads();
    } catch (error) {
      console.error("Resource update error:", error);
      toast.error(error.response?.data?.message || "Failed to update resource");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Uploads</h2>
          <p className="text-gray-600 mt-1">
            Track approval status and revise rejected resources
          </p>
        </div>
        <button
          onClick={fetchUploads}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No uploads yet
          </h3>
          <p className="text-gray-600">
            Uploaded resources will appear here with their review status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => {
            const status = getStatus(resource);
            const StatusIcon = status.icon;

            return (
              <div
                key={resource._id}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {resource.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${status.className}`}
                      >
                        <StatusIcon size={15} />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{resource.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {resource.course}
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        {resource.department}
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                        {resource.semester}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {resource.fileType}
                      </span>
                    </div>
                    {resource.rejectionReason && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                        <span className="font-semibold">Rejection reason:</span>{" "}
                        {resource.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-2 text-sm text-gray-500">
                    <span>
                      Uploaded {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    {resource.approvedAt && (
                      <span>
                        Approved {new Date(resource.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                    {resource.rejectionReason && (
                      <button
                        onClick={() => setEditingResource(resource)}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Revise
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                Revise Resource
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Updating details sends the resource back to pending review.
              </p>
            </div>
            <Formik
              initialValues={{
                title: editingResource.title,
                course: editingResource.course,
                department: editingResource.department,
                semester: editingResource.semester,
                description: editingResource.description,
              }}
              validationSchema={editResourceSchema}
              onSubmit={handleUpdate}
            >
              {({ isSubmitting }) => (
                <Form className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <Field
                      name="title"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage
                      name="title"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Course
                      </label>
                      <Field
                        name="course"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage
                        name="course"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department
                      </label>
                      <Field
                        as="select"
                        name="department"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {departments.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </Field>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Semester
                    </label>
                    <Field
                      as="select"
                      name="semester"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {semesters.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester} Semester
                        </option>
                      ))}
                    </Field>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      rows="4"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingResource(null)}
                      className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Submit Revision"}
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

export default MyUploads;
