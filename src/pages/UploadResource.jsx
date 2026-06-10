// src/pages/UploadResource.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { uploadResourceSchema } from "../utils/validationSchemas";
import {
  Upload,
  FileText,
  ArrowLeft,
  Image,
} from "lucide-react";
import { departments, semesters } from "../utils/constants";
import { useUpload } from "../context/UploadContext";
import { toast } from "sonner";

const UploadResource = () => {
  const navigate = useNavigate();
  const { startUpload, isUploading } = useUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  // Upload runs in the background (see UploadContext) — the user is sent
  // back to the resources list right away and the global progress bar at the
  // top of the app tracks upload + content safety check.
  const handleSubmit = (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("course", values.course);
    formData.append("department", values.department);
    formData.append("semester", values.semester);
    formData.append("description", values.description);
    formData.append("file", values.file);

    const started = startUpload(formData);
    setSubmitting(false);
    if (started) {
      toast.info("Upload started — you can keep browsing while we process it.");
      resetForm();
      setFilePreview(null);
      navigate("/resources");
    }
  };

  const handleSelectedFile = (file, setFieldValue, setFieldTouched) => {
    setFieldValue("file", file || null);
    setFieldTouched("file", true, false);
    setFilePreview(file || null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-[var(--text-main)]" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">Upload Resource</h2>
          <p className="text-[var(--text-muted)] mt-1">
            Share your study materials with fellow students
          </p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-8 border border-[var(--border-color)]">
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
          {({ isSubmitting, errors, touched, setFieldValue, setFieldTouched }) => (
            <Form className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                >
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g., Data Structures Complete Notes"
                  className={`w-full px-4 py-3 ${
                    errors.title && touched.title
                      ? "border-red-500"
                      : ""
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
                    className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                  >
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    id="course"
                    name="course"
                    placeholder="e.g., CSE 201"
                    className={`w-full px-4 py-3 ${
                      errors.course && touched.course
                        ? "border-red-500"
                        : ""
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
                    className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    id="department"
                    name="department"
                    className={`w-full px-4 py-3 ${
                      errors.department && touched.department
                        ? "border-red-500"
                        : ""
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
                  className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                >
                  Semester <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  id="semester"
                  name="semester"
                  className={`w-full px-4 py-3 ${
                    errors.semester && touched.semester
                      ? "border-red-500"
                      : ""
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
                  className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows="4"
                  placeholder="Provide a brief description of the resource content..."
                  className={`w-full px-4 py-3 ${
                    errors.description && touched.description
                      ? "border-red-500"
                      : ""
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
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Upload File <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    errors.file && touched.file
                      ? "border-red-500 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                      : isDragging
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : selectedFile
                      ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
                      : "border-[var(--border-color)] bg-[var(--bg-main)] hover:border-blue-400"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handleSelectedFile(
                      event.dataTransfer.files?.[0],
                      setFieldValue,
                      setFieldTouched
                    );
                  }}
                >
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf,.doc,.docx,.docm,.dot,.dotx,.dotm,.ppt,.pptx,.pptm,.pps,.ppsx,.ppsm,.pot,.potx,.potm,.xls,.xlsx,.xlsm,.xlsb,.xlt,.xltx,.xltm,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.bmp"
                    onChange={(event) => {
                      handleSelectedFile(
                        event.currentTarget.files?.[0],
                        setFieldValue,
                        setFieldTouched
                      );
                    }}
                    className="hidden"
                  />
                  <label htmlFor="file" className="block cursor-pointer">
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
                        <p className="text-[var(--text-muted)] text-sm">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                          <Upload className="text-blue-600 dark:text-blue-400" size={32} />
                        </div>
                        <p className="text-lg font-bold text-[var(--text-main)] mb-1">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                          PDF, Word, PowerPoint, Excel, Images (Max 20MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                <ErrorMessage
                  name="file"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Another upload in progress...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload Resource</span>
                  </>
                )}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default UploadResource;
