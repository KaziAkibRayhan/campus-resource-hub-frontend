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
} from "lucide-react";
import { departments, semesters } from "../utils/dummyData";

const UploadResource = () => {
  const navigate = useNavigate();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Form values:", values);
      console.log("File:", selectedFile);

      setUploadSuccess(true);
      resetForm();
      setSelectedFile(null);

      // Redirect after success message
      setTimeout(() => {
        navigate("/resources");
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Upload Resource</h2>
          <p className="text-gray-600 mt-1">
            Share your study materials with fellow students
          </p>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start space-x-3">
          <CheckCircle
            className="text-green-500 flex-shrink-0 mt-1"
            size={24}
          />
          <div>
            <h3 className="text-green-800 font-semibold mb-1">
              Upload Successful!
            </h3>
            <p className="text-green-700 text-sm">
              Your resource has been submitted for admin approval. You'll be
              notified once it's approved.
            </p>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-md p-8">
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
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g., Data Structures Complete Notes"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.title && touched.title
                      ? "border-red-500"
                      : "border-gray-300"
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
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    id="course"
                    name="course"
                    placeholder="e.g., CSE 201"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.course && touched.course
                        ? "border-red-500"
                        : "border-gray-300"
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
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    id="department"
                    name="department"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.department && touched.department
                        ? "border-red-500"
                        : "border-gray-300"
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
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Semester <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  id="semester"
                  name="semester"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.semester && touched.semester
                      ? "border-red-500"
                      : "border-gray-300"
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
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows="4"
                  placeholder="Provide a brief description of the resource content..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.description && touched.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload File <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    errors.file && touched.file
                      ? "border-red-500"
                      : "border-gray-300"
                  } ${
                    selectedFile ? "bg-blue-50 border-blue-300" : "bg-gray-50"
                  }`}
                >
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(event) => {
                      const file = event.currentTarget.files[0];
                      setFieldValue("file", file);
                      setSelectedFile(file);
                    }}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="text-blue-600 mb-3" size={48} />
                        <p className="text-blue-700 font-semibold mb-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-blue-600 text-sm mt-2 hover:underline">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="text-gray-400 mb-3" size={48} />
                        <p className="text-gray-700 font-semibold mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-gray-500 text-sm">
                          PDF, DOCX, PPTX (Max 20MB)
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

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle
                  className="text-blue-500 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="text-sm text-blue-800">
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
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
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
