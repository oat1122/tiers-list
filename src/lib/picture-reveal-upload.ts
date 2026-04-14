import crypto from "crypto";
import fs from "fs/promises";
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_RECOMMENDED_SIZE_LABEL,
  IMAGE_UPLOAD_LIMIT_BYTES,
  LEGACY_UPLOAD_ALLOWED_MIME,
} from "@/lib/image-upload-config";
import { UploadValidationError } from "@/lib/upload";

export const PICTURE_REVEAL_UPLOAD_DIR = "public/uploads/picture-reveal";
export const PICTURE_REVEAL_TEMP_UPLOAD_DIR =
  "public/uploads/picture-reveal/temp";

/**
 * Builds the public path for a finalized picture reveal upload.
 *
 * @param fileName - Stored file name inside the public upload directory.
 * @returns Browser-readable public upload path.
 */
function getPublicUploadPath(fileName: string) {
  return `/uploads/picture-reveal/${fileName}`;
}

/**
 * Builds the public path for a temporary picture reveal upload.
 *
 * @param fileName - Stored file name inside the temporary upload directory.
 * @returns Browser-readable temporary upload path.
 */
function getTempPublicUploadPath(fileName: string) {
  return `/uploads/picture-reveal/temp/${fileName}`;
}

/**
 * Creates an upload directory when it does not exist.
 *
 * @param dirPath - Relative upload directory that must be available for writes.
 * @returns Promise that resolves after the directory exists.
 */
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Validates image size and MIME type before persisting an upload.
 *
 * @param file - Browser file submitted through a route handler.
 * @param allowedMimeTypes - MIME types accepted by the current upload flow.
 * @returns Nothing when validation passes.
 * @throws UploadValidationError when the file violates size or type rules.
 */
function validateImageFile(
  file: File,
  allowedMimeTypes: readonly string[] = LEGACY_UPLOAD_ALLOWED_MIME,
) {
  if (file.size > IMAGE_UPLOAD_LIMIT_BYTES) {
    throw new UploadValidationError(
      "file_too_large",
      `File size must be at most ${IMAGE_RECOMMENDED_SIZE_LABEL} under 5MB`,
      {
        limitBytes: IMAGE_UPLOAD_LIMIT_BYTES,
        recommendedSize: IMAGE_RECOMMENDED_SIZE_LABEL,
      },
    );
  }

  if (!allowedMimeTypes.includes(file.type)) {
    throw new UploadValidationError(
      "unsupported_type",
      `Unsupported image type. Allowed: ${allowedMimeTypes
        .map((mime) => mime.replace("image/", ""))
        .join(", ")}`,
      {
        recommendedMimeTypes: allowedMimeTypes,
        recommendedSize: IMAGE_RECOMMENDED_SIZE_LABEL,
      },
    );
  }
}

/**
 * Saves a validated image file to a target upload directory.
 *
 * @param file - Browser file submitted by the editor.
 * @param directory - Filesystem directory where the upload should be stored.
 * @param publicPathFactory - Function that maps stored file names to public paths.
 * @param allowedMimeTypes - Optional MIME type override for this upload flow.
 * @returns Public path for the stored file.
 * @throws UploadValidationError when the file cannot be accepted.
 */
async function saveImageFileToDirectory(
  file: File,
  directory: string,
  publicPathFactory: (fileName: string) => string,
  allowedMimeTypes?: readonly string[],
) {
  validateImageFile(file, allowedMimeTypes);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = file.name.split(".").pop() || "png";
  const uniqueName = `${crypto.randomUUID()}.${extension}`;

  await ensureDirectoryExists(directory);

  const filePath = `${directory}/${uniqueName}`;
  await fs.writeFile(filePath, buffer);

  return publicPathFactory(uniqueName);
}

/**
 * Saves a picture reveal image to the temporary upload directory.
 *
 * @param file - Croppable image selected in the editor.
 * @returns Temporary public path that can later be finalized on save.
 * @throws UploadValidationError when the file cannot be accepted.
 */
export async function savePictureRevealTempImageFile(file: File) {
  return saveImageFileToDirectory(
    file,
    PICTURE_REVEAL_TEMP_UPLOAD_DIR,
    getTempPublicUploadPath,
    CROPPABLE_IMAGE_MIME,
  );
}

/**
 * Moves a temporary picture reveal upload into the permanent public directory.
 *
 * @param tempPath - Temporary public path returned by the upload endpoint.
 * @returns Permanent public path for the finalized image.
 * @throws Error when the provided path is not a picture reveal temp upload.
 */
export async function finalizePictureRevealTempImageFile(tempPath: string) {
  const tempPrefix = "/uploads/picture-reveal/temp/";

  if (!tempPath.startsWith(tempPrefix)) {
    throw new Error("Invalid temporary image path");
  }

  const fileName = tempPath.slice(tempPrefix.length);

  if (!fileName || fileName.includes("/")) {
    throw new Error("Invalid temporary image path");
  }

  const sourcePath = `${PICTURE_REVEAL_TEMP_UPLOAD_DIR}/${fileName}`;
  const destinationPath = `${PICTURE_REVEAL_UPLOAD_DIR}/${fileName}`;

  await ensureDirectoryExists(PICTURE_REVEAL_UPLOAD_DIR);
  await fs.rename(sourcePath, destinationPath);

  return getPublicUploadPath(fileName);
}
