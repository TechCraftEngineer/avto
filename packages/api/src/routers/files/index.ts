import { createRouter } from "../../orpc";
import { getFileUrl } from "./get-file-url";
import { getImageUrl } from "./get-image";
import { getInterviewMedia } from "./get-interview-media";
import { uploadInterviewMedia } from "./upload-interview-media";

export const filesRouter = createRouter({
  getFileUrl,
  getImageUrl,
  getInterviewMedia,
  uploadInterviewMedia,
});
