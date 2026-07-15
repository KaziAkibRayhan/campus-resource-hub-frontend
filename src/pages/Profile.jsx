import React, { useState } from "react";
import {
  Camera,
  CheckCircle,
  ImageUp,
  Loader2,
  Lock,
  Mail,
  Save,
  User,
  UserCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../components/common/ConfirmDialog";
import { departments } from "../utils/constants";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const confirm = useConfirm();
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
      toast.error("Invalid image file", {
        description: "Please choose a JPG, PNG or WEBP image.",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    toast.success("Photo selected", {
      description: "Preview updated — click Save Changes to apply it.",
    });
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

    const changingPassword = Boolean(form.newPassword || form.currentPassword);

    if (changingPassword) {
      if (!form.currentPassword || !form.newPassword) {
        toast.error("Password change incomplete", {
          description:
            "Fill in both your current and new password, or clear both fields.",
        });
        return;
      }
      const ok = await confirm({
        title: "Change your password?",
        message:
          "You'll need to use the new password the next time you sign in.",
        confirmText: "Change Password",
        variant: "warning",
      });
      if (!ok) return;
    }

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
      if (changingPassword) {
        toast.success("Password changed", {
          description: "Your profile details were saved too.",
        });
      } else if (selectedImage) {
        toast.success("Profile updated", {
          description: "Your new photo and details are live.",
        });
      } else {
        toast.success("Profile updated", {
          description: "Your account details have been saved.",
        });
      }
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

    toast.error(result.error || "Failed to update profile", {
      description: "Please review your details and try again.",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <UserCircle size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">Profile</h2>
          <p className="text-[var(--text-muted)] mt-1">
            Manage your account details and profile picture.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <section className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
          <div className="flex flex-col items-center text-center">
            <div className="group relative h-32 w-32 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 overflow-hidden flex items-center justify-center shadow-inner ring-2 ring-blue-500/30 ring-offset-2 ring-offset-[var(--bg-card)]">
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
                <label className="absolute inset-0 bg-black/60 text-white text-xs font-semibold cursor-pointer flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <Camera size={18} />
                  Change photo
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
            <span className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize bg-blue-500/10 text-blue-500 border border-blue-500/20">
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

        <section className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">
                  Account Information
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Changes sync immediately across the app.
                </p>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={startEdit}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {editMode && (
              <div className="rounded-xl border border-[var(--border-color)] p-5 bg-[var(--bg-main)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <ImageUp size={18} />
                  </div>
                  <h4 className="font-bold text-[var(--text-main)]">
                    Profile Picture
                  </h4>
                </div>
                <div className="flex flex-col md:flex-row gap-5 items-start">
                  <div className="h-28 w-28 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center ring-2 ring-blue-500/30">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={user?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={36} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold cursor-pointer transition focus-within:ring-2 focus-within:ring-blue-500/40">
                      <Camera size={16} />
                      Choose Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-[var(--text-muted)]">
                      JPG, PNG or WEBP. Preview updates immediately before save.
                    </p>
                    {selectedImage && (
                      <p className="text-sm text-[var(--text-main)]">
                        Selected: {selectedImage.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="profile-department"
                  className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                >
                  Department
                </label>
                <select
                  id="profile-department"
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                  disabled={!editMode}
                  className="w-full px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="profile-student-id"
                  className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                >
                  Student ID
                </label>
                <input
                  id="profile-student-id"
                  value={user?.studentId || ""}
                  disabled
                  className="w-full px-4 py-3"
                />
              </div>
            </div>

            {editMode && (
              <div className="rounded-xl border border-[var(--border-color)] p-5 bg-[var(--bg-main)]">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Lock size={18} />
                  </div>
                  <h4 className="font-bold text-[var(--text-main)]">
                    Change Password
                  </h4>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-4 ml-[46px]">
                  Optional — leave both fields empty to keep your current password.
                </p>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="profile-current-password"
                      className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                    >
                      Current Password
                    </label>
                    <input
                      id="profile-current-password"
                      type="password"
                      value={form.currentPassword}
                      onChange={(event) =>
                        setForm({ ...form, currentPassword: event.target.value })
                      }
                      placeholder="Current password"
                      className="w-full px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-new-password"
                      className="block text-sm font-semibold text-[var(--text-muted)] mb-2"
                    >
                      New Password
                    </label>
                    <input
                      id="profile-new-password"
                      type="password"
                      value={form.newPassword}
                      onChange={(event) =>
                        setForm({ ...form, newPassword: event.target.value })
                      }
                      placeholder="New password"
                      className="w-full px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {editMode && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="px-5 py-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  <XCircle size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-semibold flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
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
