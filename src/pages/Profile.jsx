import React, { useState } from "react";
import {
  Camera,
  CheckCircle,
  ImageUp,
  Lock,
  Mail,
  Save,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { departments } from "../utils/constants";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: user?.department || "",
    currentPassword: "",
    newPassword: "",
  });

  const startEdit = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      department: user?.department || "",
      currentPassword: "",
      newPassword: "",
    });
    setEditMode(true);
  };

  const imageSrc = previewUrl || user?.profileImage;

  const handleImageChange = (event) => {
    const file = event.currentTarget.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setEditMode(false);
    setSelectedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      department: user?.department || "",
      currentPassword: "",
      newPassword: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("department", form.department);
    if (form.currentPassword) formData.append("currentPassword", form.currentPassword);
    if (form.newPassword) formData.append("newPassword", form.newPassword);
    if (selectedImage) formData.append("profileImage", selectedImage);

    const result = await updateProfile(formData);
    setSaving(false);

    if (result.success) {
      toast.success("Profile updated");
      setEditMode(false);
      setSelectedImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setForm({
        name: result.user.name || "",
        email: result.user.email || "",
        department: result.user.department || "",
        currentPassword: "",
        newPassword: "",
      });
      return;
    }

    toast.error(result.error);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Profile
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          Manage your account details and profile picture.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <section className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)] p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-32 w-32 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 overflow-hidden flex items-center justify-center shadow-inner">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={48} />
              )}
              {editMode && (
                <label className="absolute inset-x-0 bottom-0 bg-black/60 text-white py-2 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1">
                  <Camera size={14} />
                  Change
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <h3 className="mt-4 text-xl font-bold text-[var(--text-main)]">
              {user?.name}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {user?.studentId}
            </p>
            <span className="mt-3 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-semibold capitalize">
              {user?.role}
            </span>
          </div>

            <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <Mail size={17} />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <CheckCircle size={17} />
              <span>{user?.department}</span>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-card)] rounded-xl shadow-md border border-[var(--border-color)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                Account Information
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                Changes sync immediately across the app.
              </p>
            </div>
            {!editMode && (
              <button
                onClick={startEdit}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition shadow-md"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {editMode && (
              <div className="rounded-xl border border-[var(--border-color)] p-5 bg-[var(--bg-main)]">
                <div className="flex items-center gap-2 mb-4">
                  <ImageUp size={18} className="text-[var(--text-muted)]" />
                  <h4 className="font-bold text-[var(--text-main)]">
                    Profile Picture
                  </h4>
                </div>
                <div className="flex flex-col md:flex-row gap-5 items-start">
                  <div className="h-28 w-28 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={user?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={36} className="text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold cursor-pointer">
                      <Camera size={16} />
                      Choose Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      JPG, PNG or WEBP. Preview updates immediately before save.
                    </p>
                    {selectedImage && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Selected: {selectedImage.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-3"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                  disabled={!editMode}
                  className="w-full px-4 py-3"
                >
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Student ID
                </label>
                <input
                  value={user?.studentId || ""}
                  disabled
                  className="w-full px-4 py-3"
                />
              </div>
            </div>

            {editMode && (
              <div className="rounded-xl border border-[var(--border-color)] p-5 bg-[var(--bg-main)]">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={18} className="text-[var(--text-muted)]" />
                  <h4 className="font-bold text-[var(--text-main)]">
                    Change Password
                  </h4>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <input
                    type="password"
                    value={form.currentPassword}
                    onChange={(event) =>
                      setForm({ ...form, currentPassword: event.target.value })
                    }
                    placeholder="Current password"
                    className="w-full px-4 py-3"
                  />
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={(event) =>
                      setForm({ ...form, newPassword: event.target.value })
                    }
                    placeholder="New password"
                    className="w-full px-4 py-3"
                  />
                </div>
              </div>
            )}

            {editMode && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold flex items-center justify-center gap-2 transition"
                >
                  <XCircle size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-semibold flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
