// src/pages/Legal.jsx — public Terms & Conditions / Privacy Policy page
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

const sections = {
  terms: {
    icon: FileText,
    title: "Terms & Conditions",
    updated: "Last updated: June 2026",
    items: [
      ["Acceptance of Terms", "By creating an account on Campus Resource Hub, you agree to use the platform responsibly as a member of the campus community."],
      ["Account Responsibility", "You are responsible for keeping your login credentials safe. Accounts are personal and must not be shared."],
      ["Acceptable Use", "Upload only study materials and content you have the right to share. Harassment, spam, plagiarized content, or harmful files are not allowed and may lead to account suspension."],
      ["Content Moderation", "Uploaded resources, announcements, events, and lost & found posts are scanned and may be reviewed by moderators. Content that violates these terms can be removed."],
      ["Service Availability", "Campus Resource Hub is a student project provided as-is, without guarantees of uninterrupted availability."],
    ],
  },
  privacy: {
    icon: ShieldCheck,
    title: "Privacy Policy",
    updated: "Last updated: June 2026",
    items: [
      ["Information We Collect", "Your name, email, student ID, department, and the content you post (resources, messages, announcements, events, lost & found items)."],
      ["How We Use It", "To operate the platform: account verification via OTP email, showing your posts to other members, sending in-app notifications, and powering search and the AI assistant."],
      ["What We Don't Do", "We do not sell your data or share it outside the platform. Email is used only for verification and password reset."],
      ["File Storage", "Uploaded files are stored securely on our cloud storage provider (Cloudinary) and served only through the app."],
      ["Your Control", "You can edit your profile, delete your own posts, and request account removal by contacting an admin."],
    ],
  },
};

const Legal = () => {
  const { pathname } = useLocation();
  const section = pathname === "/privacy" ? sections.privacy : sections.terms;
  const Icon = section.icon;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/signup"
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-200 dark:border-slate-800 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <Icon size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {section.title}
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500 mb-8 ml-14">{section.updated}</p>

          <div className="space-y-6">
            {section.items.map(([heading, body], index) => (
              <div key={heading}>
                <h2 className="font-bold text-gray-800 dark:text-slate-200 mb-1">
                  {index + 1}. {heading}
                </h2>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
            <Link to="/terms" className={`font-semibold ${pathname !== "/privacy" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-slate-500 hover:text-blue-600"}`}>
              Terms & Conditions
            </Link>
            <Link to="/privacy" className={`font-semibold ${pathname === "/privacy" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-slate-500 hover:text-blue-600"}`}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
