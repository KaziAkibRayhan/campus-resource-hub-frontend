import test from "node:test";
import assert from "node:assert/strict";
import { uploadResourceSchema } from "../src/utils/validationSchemas.js";

const baseResource = {
  title: "Data structures notes",
  course: "CSE 201",
  department: "CSE",
  semester: "2nd",
  description: "A concise guide to the core data structures.",
  content: "",
  file: null,
};

const pdfFile = {
  name: "data-structures.pdf",
  type: "application/pdf",
  size: 1024,
};

const textFile = {
  name: "quick-notes.txt",
  type: "text/plain",
  size: 512,
};

test("file resources require a supported file", async () => {
  await assert.rejects(
    uploadResourceSchema.validate({
      ...baseResource,
      resourceType: "FILE",
    }),
    /File is required/
  );

  await assert.doesNotReject(
    uploadResourceSchema.validate({
      ...baseResource,
      resourceType: "FILE",
      file: pdfFile,
    })
  );

  await assert.doesNotReject(
    uploadResourceSchema.validate({
      ...baseResource,
      resourceType: "FILE",
      file: textFile,
    })
  );
});

test("text resources require substantial content but allow no attachment", async () => {
  await assert.rejects(
    uploadResourceSchema.validate({
      ...baseResource,
      resourceType: "TEXT",
      content: "Too short",
    }),
    /Content must be at least 50 characters/
  );

  await assert.doesNotReject(
    uploadResourceSchema.validate({
      ...baseResource,
      resourceType: "TEXT",
      content:
        "This is a complete text resource with enough detail to be useful to other students.",
    })
  );
});

test("optional text-resource attachments still follow file restrictions", async () => {
  await assert.rejects(
    uploadResourceSchema.validate({
      ...baseResource,
      resourceType: "TEXT",
      content:
        "This is a complete text resource with enough detail to be useful to other students.",
      file: { name: "unsafe.exe", type: "application/octet-stream", size: 100 },
    }),
    /Only PDF, Word, PowerPoint, Excel, images, TXT, and ZIP files are allowed/
  );
});
