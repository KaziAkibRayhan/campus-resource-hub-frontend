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
  Loader2,
  X,
} from "lucide-react";
import { departments, semesters } from "../utils/constants";
import { useUpload } from "../context/UploadContext";
import { toast } from "sonner";

// Human-readable file size (e.g. 812 KB, 4.2 MB).
const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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
  // top of the app tracks upload + content safety check. UploadContext also
  // owns the success / under-review / rejected / error toasts on completion.
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
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <ArrowLeft size={24} className="text-[var(--text-main)]" />
        </button>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Upload size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">
            Upload Resource
          </h2>
          <p className="text-[var(--text-muted)] mt-1">
            Share your study materials with fellow students
          </p>
        </div>
      </div>

      {/* Upload Form */}
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
            {/* Resource Details */}
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 md:p-8 border border-[var(--border-color)]">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">
                    Resource Details
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  <span className="text-red-500">*</span> required
                </p>
              </div>

              <div className="space-y-6">
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
                      errors.title && touched.title ? "border-red-500" : ""
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
                        errors.course && touched.course ? "border-red-500" : ""
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
                      errors.semester && touched.semester ? "border-red-500" : ""
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
              </div>
            </div>

            {/* File */}
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 md:p-8 border border-[var(--border-color)]">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">
                    File <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    PDF, Word, PowerPoint, Excel or images, up to 20MB
                  </p>
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  errors.file && touched.file
                    ? "border-red-500 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                    : isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : selectedFile
                    ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
                    : "border-[var(--border-color)] bg-[var(--bg-main)] hover:border-blue-400 hover:bg-[var(--bg-hover)]"
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
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {selectedFile.type.startsWith("image/") ? (
                        <Image size={26} />
                      ) : (
                        <FileText size={26} />
                      )}
                    </div>
                    {/* Selected-file chip: name + size + remove */}
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 pl-4 pr-1.5 py-1.5">
                      <span className="truncate text-sm font-semibold">
                        {selectedFile.name}
                      </span>
                      <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">
                        {formatFileSize(selectedFile.size)}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove selected file"
                        onClick={() =>
                          handleSelectedFile(null, setFieldValue, setFieldTouched)
                        }
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <label
                      htmlFor="file"
                      className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Choose a different file
                    </label>
                  </div>
                ) : (
                  <label htmlFor="file" className="block cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-4">
                        <Upload size={26} />
                      </div>
                      <p className="text-lg font-bold text-[var(--text-main)] mb-1">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        PDF, Word, PowerPoint, Excel, Images (Max 20MB)
                      </p>
                    </div>
                  </label>
                )}
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
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Another upload in progress...</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Starting upload...</span>
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
  );
};

export default UploadResource;
