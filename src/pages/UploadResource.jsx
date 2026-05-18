// src/pages/UploadResource.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { uploadResourceSchema } from "../utils/validationSchemas";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Image,
} from "lucide-react";
import { departments, semesters } from "../utils/constants";
import { resourceService } from "../services/api";
import { toast } from "sonner";

const UploadResource = () => {
  const navigate = useNavigate();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const setFilePreview = (file) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("course", values.course);
      formData.append("department", values.department);
      formData.append("semester", values.semester);
      formData.append("description", values.description);
      formData.append("file", values.file);

      const response = await resourceService.upload(formData);

      setUploadSuccess(true);
      toast.success(response.data.message);
      resetForm();
      setFilePreview(null);

      // Redirect after success message
      setTimeout(() => {
        navigate("/resources");
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error uploading resource");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Upload Resource</h2>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Share your study materials with fellow students
          </p>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 flex items-start space-x-3">
          <CheckCircle
            className="text-green-500 flex-shrink-0 mt-1"
            size={24}
          />
          <div>
            <h3 className="text-green-800 dark:text-green-400 font-semibold mb-1">
              Upload Successful!
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Your resource has been submitted for admin approval. You'll be
              notified once it's approved.
            </p>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 border border-transparent dark:border-slate-800">
        <Formik
          initialValues={{
            title: "",
            course: "",
            department: "",
            semester: "",
            description: "",
            file: null,
          }}
          validationSchema={uploadResourceSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, setFieldValue }) => (
            <Form className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                >
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g., Data Structures Complete Notes"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 ${
                    errors.title && touched.title
                      ? "border-red-500"
                      : "border-gray-300 dark:border-slate-700"
                  }`}
                />
                <ErrorMessage
                  name="title"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Course Code & Department */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="course"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    id="course"
                    name="course"
                    placeholder="e.g., CSE 201"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 ${
                      errors.course && touched.course
                        ? "border-red-500"
                        : "border-gray-300 dark:border-slate-700"
                    }`}
                  />
                  <ErrorMessage
                    name="course"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    id="department"
                    name="department"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 ${
                      errors.department && touched.department
                        ? "border-red-500"
                        : "border-gray-300 dark:border-slate-700"
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="department"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>

              {/* Semester */}
              <div>
                <label
                  htmlFor="semester"
                  className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                >
                  Semester <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  id="semester"
                  name="semester"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 ${
                    errors.semester && touched.semester
                      ? "border-red-500"
                      : "border-gray-300 dark:border-slate-700"
                  }`}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem} Semester
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="semester"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows="4"
                  placeholder="Provide a brief description of the resource content..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 ${
                    errors.description && touched.description
                      ? "border-red-500"
                      : "border-gray-300 dark:border-slate-700"
                  }`}
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Upload File <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    errors.file && touched.file
                      ? "border-red-500 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                      : selectedFile
                      ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
                      : "border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                >
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.jpg,.jpeg,.png,.webp"
                    onChange={(event) => {
                      const file = event.currentTarget.files[0];
                      setFieldValue("file", file);
                      setFilePreview(file);
                    }}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        {selectedFile.type.startsWith("image/") ? (
                          <Image className="text-blue-600 dark:text-blue-400 mb-3" size={48} />
                        ) : (
                          <FileText className="text-blue-600 dark:text-blue-400 mb-3" size={48} />
                        )}
                        <p className="text-blue-700 dark:text-blue-300 font-semibold mb-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-gray-600 dark:text-slate-400 text-sm">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="text-gray-400 dark:text-slate-500 mb-3" size={48} />
                        <p className="text-gray-700 dark:text-slate-300 font-semibold mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                          PDF, DOCX, PPTX, XLSX, Images (Max 20MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {previewUrl && (
                  <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Preview before upload
                    </div>
                    <div className="h-80 flex items-center justify-center bg-white dark:bg-slate-900">
                      {selectedFile?.type === "application/pdf" ? (
                        <iframe
                          src={`${previewUrl}#toolbar=1&navpanes=0`}
                          title="Selected PDF preview"
                          className="h-full w-full border-none"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Selected resource preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}
                <ErrorMessage
                  name="file"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle
                  className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      All uploads require admin approval before being visible to
                      other students
                    </li>
                    <li>
                      Please ensure the content is accurate and appropriate for
                      educational use
                    </li>
                    <li>Maximum file size is 20MB</li>
                  </ul>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="mr-2" />
                      Upload Resource
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 sm:flex-none bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default UploadResource;
