import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  resumeUploader: f({ pdf: { maxFileSize: "4MB" }, image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("File upload completed safely hosted at URL:", file.url);
      return { uploadedBy: "applicant", url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;