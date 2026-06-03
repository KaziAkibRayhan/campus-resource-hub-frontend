import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { AlertCircle, BookOpen, CheckCircle, Lock, Mail } from "lucide-react";
import { forgotPasswordSchema, resetPasswordSchema } from "../../utils/validationSchemas";
import { useAuth } from "../../context/AuthContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestCode = async (values, { setSubmitting }) => {
    setError("");
    setMessage("");
    const result = await forgotPassword(values.email);

    if (result.success) {
      setEmail(values.email);
      setStep("reset");
      setMessage(result.message || "Reset code sent to your email");
    } else {
      setError(result.error || "Failed to send reset code");
    }

    setSubmitting(false);
  };

  const handleResetPassword = async (values, { setSubmitting }) => {
    setError("");
    const result = await resetPassword({
      email: values.email,
      otp: values.otp,
      newPassword: values.newPassword,
    });

    if (result.success) {
      setMessage(result.message || "Password reset successfully");
      setTimeout(() => navigate("/login"), 1200);
    } else {
      setError(result.error || "Failed to reset password");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl">
              <BookOpen size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Use an email OTP to set a new password
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-transparent dark:border-slate-800">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-700 dark:text-green-400 text-sm">{message}</p>
            </div>
          )}

          {step === "email" ? (
            <Formik
              initialValues={{ email: "" }}
              validationSchema={forgotPasswordSchema}
              onSubmit={handleRequestCode}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        placeholder="student@university.edu"
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors.email && touched.email
                            ? "border-red-500"
                            : "border-gray-300 dark:border-slate-700"
                        }`}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting ? "Sending..." : "Send Reset Code"}
                  </button>
                </Form>
              )}
            </Formik>
          ) : (
            <Formik
              initialValues={{
                email,
                otp: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={resetPasswordSchema}
              onSubmit={handleResetPassword}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-5">
                  <Field type="hidden" name="email" />

                  <div>
                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Reset Code
                    </label>
                    <Field
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      id="otp"
                      name="otp"
                      placeholder="Enter 6 digit OTP"
                      className={`w-full px-4 py-3 text-center tracking-[0.35em] border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        errors.otp && touched.otp ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                      }`}
                    />
                    <ErrorMessage name="otp" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                      <Field
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors.newPassword && touched.newPassword ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                        }`}
                      />
                    </div>
                    <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <Field
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        errors.confirmPassword && touched.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-slate-700"
                      }`}
                    />
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
