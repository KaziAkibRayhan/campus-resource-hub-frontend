import * as Yup from "yup";

// Login Validation Schema
export const loginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// Signup Validation Schema
export const signupSchema = Yup.object({
  name: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  studentId: Yup.string()
    .matches(/^[0-9]{6,20}$/, "Student ID must be 6 to 20 digits")
    .required("Student ID is required"),
  department: Yup.string().required("Department is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
});

export const otpSchema = Yup.object({
  otp: Yup.string()
    .matches(/^[0-9]{6}$/, "OTP must be a 6 digit code")
    .required("OTP is required"),
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

export const resetPasswordSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  otp: Yup.string()
    .matches(/^[0-9]{6}$/, "OTP must be a 6 digit code")
    .required("OTP is required"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm password is required"),
});

// Upload Resource Validation Schema
export const uploadResourceSchema = Yup.object({
  title: Yup.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters")
    .required("Title is required"),
  course: Yup.string().required("Course is required"),
  department: Yup.string().required("Department is required"),
  semester: Yup.string().required("Semester is required"),
  description: Yup.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .required("Description is required"),
  file: Yup.mixed()
    .required("File is required")
    .test("fileSize", "File size must be less than 20MB", (value) => {
      return value && value.size <= 20 * 1024 * 1024; // 20MB
    })
    .test("fileType", "Only PDF, Word, PowerPoint, Excel, and images are allowed", (value) => {
      if (!value) return false;

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-word.document.macroEnabled.12",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
        "application/vnd.ms-word.template.macroEnabled.12",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint",
        "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
        "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
        "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",
        "application/vnd.openxmlformats-officedocument.presentationml.template",
        "application/vnd.ms-powerpoint.template.macroEnabled.12",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/vnd.ms-excel.sheet.macroEnabled.12",
        "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
        "application/vnd.ms-excel.template.macroEnabled.12",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
        "image/jpeg",
        "image/jpg",
        "image/pjpeg",
        "image/x-citrix-jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
        "image/svg+xml",
        "image/bmp",
      ];
      const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".docm",
        ".dot",
        ".dotx",
        ".dotm",
        ".ppt",
        ".pptx",
        ".pptm",
        ".pps",
        ".ppsx",
        ".ppsm",
        ".pot",
        ".potx",
        ".potm",
        ".xls",
        ".xlsx",
        ".xlsm",
        ".xlsb",
        ".xlt",
        ".xltx",
        ".xltm",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
        ".avif",
        ".svg",
        ".bmp",
      ];
      const fileName = value.name?.toLowerCase() || "";

      return (
        allowedTypes.includes(value.type) ||
        allowedExtensions.some((extension) => fileName.endsWith(extension))
      );
    }),
});

// Create Announcement Validation Schema
export const createAnnouncementSchema = Yup.object({
  title: Yup.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters")
    .required("Title is required"),
  department: Yup.string().required("Department is required"),
  content: Yup.string()
    .min(20, "Content must be at least 20 characters")
    .max(1000, "Content must be less than 1000 characters")
    .required("Content is required"),
});

// Lost & Found Validation Schema
export const lostFoundSchema = Yup.object({
  type: Yup.string()
    .oneOf(["lost", "found"], "Invalid type")
    .required("Type is required"),
  item: Yup.string()
    .min(3, "Item name must be at least 3 characters")
    .max(50, "Item name must be less than 50 characters")
    .required("Item name is required"),
  description: Yup.string()
    .min(10, "Description must be at least 10 characters")
    .max(300, "Description must be less than 300 characters")
    .required("Description is required"),
  location: Yup.string()
    .min(3, "Location must be at least 3 characters")
    .max(100, "Location must be less than 100 characters")
    .required("Location is required"),
  contact: Yup.string()
    .min(5, "Contact must be at least 5 characters")
    .required("Contact is required"),
  image: Yup.mixed()
    .test("fileSize", "Image size must be less than 5MB", (value) => {
      if (!value) return true; // Image is optional
      return value.size <= 5 * 1024 * 1024; // 5MB
    })
    .test("fileType", "Only image files are allowed", (value) => {
      if (!value) return true; // Image is optional
      return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        value.type
      );
    }),
});
