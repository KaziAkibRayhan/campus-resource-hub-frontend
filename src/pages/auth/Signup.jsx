// src/pages/auth/Signup.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { signupSchema } from "../../utils/validationSchemas";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Hash,
  Building2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { departments } from "../../utils/constants";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState("");

  const handleSubmit = async (values, { setSubmitting }) => {
    setSignupError("");
    const result = await signup(values);

    if (result.success) {
      navigate("/login");
    } else {
      setSignupError(result.error || "Signup failed. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-2xl">
              <BookOpen size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-slate-400">Join Campus Resource Hub today</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-transparent dark:border-slate-800">
          {signupError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
              <AlertCircle
                className="text-red-500 flex-shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-red-700 dark:text-red-400 text-sm">{signupError}</p>
            </div>
          )}

          <Formik
            initialValues={{
              name: "",
              email: "",
              studentId: "",
              department: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={signupSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, values }) => (
              <Form className="space-y-5">
                {/* Name & Email */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={20}
                      />
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors.name && touched.name
                            ? "border-red-500"
                            : "border-gray-300 dark:border-slate-700"
                        }`}
                      />
                    </div>
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={20}
                      />
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        placeholder="john@university.edu"
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors.email && touched.email
                            ? "border-red-500"
                            : "border-gray-300 dark:border-slate-700"
                        }`}
                      />
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                {/* Student ID & Department */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Student ID Field */}
                  <div>
                    <label
                      htmlFor="studentId"
                      className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Student ID
                    </label>
                    <div className="relative">
                      <Hash
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={20}
                      />
                      <Field
                        type="text"
                        id="studentId"
                        name="studentId"
                        placeholder="4223020858"
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors.studentId && touched.studentId
                            ? "border-red-500"
                            : "border-gray-300 dark:border-slate-700"
                        }`}
                      />
                    </div>
                    <ErrorMessage
                      name="studentId"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Department Field */}
                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Department
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={20}
                      />
                      <Field
                        as="select"
                        id="department"
                        name="department"
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none ${
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
                    </div>
                    <ErrorMessage
                      name="department"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={20}
                      />
                      <Field
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-12 py-3 border rounded-lg bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors.password && touched.password
                            ? "border-red-500"
                            : "border-gray-300 dark:border-slate-700"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={20}
                      />
                      <Field
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-12 py-3 border rounded-lg bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors.confirmPassword && touched.confirmPassword
                            ? "border-red-500"
                            : "border-gray-300 dark:border-slate-700"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                {/* Password Requirements */}
                {values.password && (
                  <div className="bg-gray-50 dark:bg-slate-950 rounded-lg p-4 border border-transparent dark:border-slate-800">
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Password Requirements:
                    </p>
                    <div className="space-y-1 text-sm">
                      <div
                        className={`flex items-center ${
                          values.password.length >= 6
                            ? "text-green-600"
                            : "text-gray-500 dark:text-slate-500"
                        }`}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        <span>At least 6 characters</span>
                      </div>
                      <div
                        className={`flex items-center ${
                          /[a-z]/.test(values.password)
                            ? "text-green-600"
                            : "text-gray-500 dark:text-slate-500"
                        }`}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        <span>One lowercase letter</span>
                      </div>
                      <div
                        className={`flex items-center ${
                          /[A-Z]/.test(values.password)
                            ? "text-green-600"
                            : "text-gray-500 dark:text-slate-500"
                        }`}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        <span>One uppercase letter</span>
                      </div>
                      <div
                        className={`flex items-center ${
                          /[0-9]/.test(values.password)
                            ? "text-green-600"
                            : "text-gray-500 dark:text-slate-500"
                        }`}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        <span>One number</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-700 rounded focus:ring-blue-500 mt-1 bg-white dark:bg-slate-950"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-slate-400">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
