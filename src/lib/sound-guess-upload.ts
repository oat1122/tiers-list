import crypto from "crypto";
import fs from "fs/promises";
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_RECOMMENDED_SIZE_LABEL,
  IMAGE_UPLOAD_LIMIT_BYTES,
} from "@/lib/image-upload-config";
import { UploadValidationError } from "@/lib/upload";

export const SOUND_GUESS_AUDIO_UPLOAD_LIMIT_BYTES = 20 * 1024 * 1024;
export const SOUND_GUESS_AUDIO_RECOMMENDED_SIZE_LABEL = "20MB";
export const SOUND_GUESS_AUDIO_MIME = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
] as const;

export const SOUND_GUESS_AUDIO_UPLOAD_DIR = "public/uploads/sound-guess/audio";
export const SOUND_GUESS_AUDIO_TEMP_UPLOAD_DIR =
  "public/uploads/sound-guess/audio/temp";
export const SOUND_GUESS_COVER_UPLOAD_DIR = "public/uploads/sound-guess/covers";
export const SOUND_GUESS_COVER_TEMP_UPLOAD_DIR =
  "public/uploads/sound-guess/covers/temp";

/**
 * Builds the public path for a stored sound guess upload.
 *
 * @param basePath - Browser-readable directory for the uploaded file.
 * @param fileName - Stored file name inside the upload directory.
 * @returns Browser-readable public upload path.
 */
function getPublicUploadPath(basePath: string, fileName: string) {
  return `${basePath}/${fileName}`;
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
 * Validates an uploaded file against feature-specific size and MIME limits.
 *
 * @param file - Browser file submitted through a route handler.
 * @param allowedMimeTypes - MIME types accepted by the current upload flow.
 * @param limitBytes - Maximum accepted file size in bytes.
 * @param sizeLabel - Human-readable file size used in validation responses.
 * @returns Nothing when validation passes.
 * @throws UploadValidationError when the file violates size or type rules.
 */
function validateUploadedFile(
  file: File,
  allowedMimeTypes: readonly string[],
  limitBytes: number,
  sizeLabel: string,
) {
  if (file.size > limitBytes) {
    throw new UploadValidationError(
      "file_too_large",
      `File size must be at most ${sizeLabel}`,
      {
        limitBytes,
        recommendedSize: sizeLabel,
      },
    );
  }

  if (!allowedMimeTypes.includes(file.type)) {
    throw new UploadValidationError(
      "unsupported_type",
      `Unsupported file type. Allowed: ${allowedMimeTypes.join(", ")}`,
      {
        recommendedMimeTypes: allowedMimeTypes,
        recommendedSize: sizeLabel,
      },
    );
  }
}

/**
 * Saves a validated upload file to a target directory.
 *
 * @param file - Browser file submitted by the editor.
 * @param directory - Filesystem directory where the upload should be stored.
 * @param publicBasePath - Browser-readable base path for the stored file.
 * @param allowedMimeTypes - MIME types accepted by the current upload flow.
 * @param limitBytes - Maximum accepted file size in bytes.
 * @param sizeLabel - Human-readable file size used in validation responses.
 * @returns Public path for the stored file.
 * @throws UploadValidationError when the file cannot be accepted.
 */
async function saveFileToDirectory(
  file: File,
  directory: string,
  publicBasePath: string,
  allowedMimeTypes: readonly string[],
  limitBytes: number,
  sizeLabel: string,
) {
  validateUploadedFile(file, allowedMimeTypes, limitBytes, sizeLabel);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = file.name.split(".").pop() || "bin";
  const uniqueName = `${crypto.randomUUID()}.${extension}`;

  await ensureDirectoryExists(directory);
  await fs.writeFile(`${directory}/${uniqueName}`, buffer);

  return getPublicUploadPath(publicBasePath, uniqueName);
}

/**
 * Moves a temporary upload into the permanent public directory.
 *
 * @param tempPath - Temporary public path returned by an upload endpoint.
 * @param tempPublicPrefix - Public prefix that identifies valid temp uploads.
 * @param tempDirectory - Filesystem directory currently holding temp files.
 * @param finalDirectory - Filesystem directory where finalized files are stored.
 * @param finalPublicBasePath - Browser-readable base path for finalized files.
 * @returns Permanent public path for the finalized file.
 * @throws Error when the provided path is not a valid temp upload.
 */
async function finalizeTempFile(
  tempPath: string,
  tempPublicPrefix: string,
  tempDirectory: string,
  finalDirectory: string,
  finalPublicBasePath: string,
) {
  if (!tempPath.startsWith(tempPublicPrefix)) {
    throw new Error("Invalid temporary upload path");
  }

  const fileName = tempPath.slice(tempPublicPrefix.length);

  if (!fileName || fileName.includes("/")) {
    throw new Error("Invalid temporary upload path");
  }

  await ensureDirectoryExists(finalDirectory);
  await fs.rename(`${tempDirectory}/${fileName}`, `${finalDirectory}/${fileName}`);

  return getPublicUploadPath(finalPublicBasePath, fileName);
}

/**
 * Saves a sound guess audio file to the temporary upload directory.
 *
 * @param file - Audio file selected in the editor.
 * @returns Temporary public path that can later be finalized on save.
 * @throws UploadValidationError when the file cannot be accepted.
 */
export async function saveSoundGuessTempAudioFile(file: File) {
  return saveFileToDirectory(
    file,
    SOUND_GUESS_AUDIO_TEMP_UPLOAD_DIR,
    "/uploads/sound-guess/audio/temp",
    SOUND_GUESS_AUDIO_MIME,
    SOUND_GUESS_AUDIO_UPLOAD_LIMIT_BYTES,
    SOUND_GUESS_AUDIO_RECOMMENDED_SIZE_LABEL,
  );
}

/**
 * Saves a sound guess cover image to the temporary upload directory.
 *
 * @param file - Cover image selected in the editor.
 * @returns Temporary public path that can later be finalized on save.
 * @throws UploadValidationError when the file cannot be accepted.
 */
export async function saveSoundGuessTempCoverImageFile(file: File) {
  return saveFileToDirectory(
    file,
    SOUND_GUESS_COVER_TEMP_UPLOAD_DIR,
    "/uploads/sound-guess/covers/temp",
    CROPPABLE_IMAGE_MIME,
    IMAGE_UPLOAD_LIMIT_BYTES,
    IMAGE_RECOMMENDED_SIZE_LABEL,
  );
}

/**
 * Moves a temporary sound guess audio upload into the permanent public directory.
 *
 * @param tempPath - Temporary audio path returned by the upload endpoint.
 * @returns Permanent public path for the finalized audio file.
 * @throws Error when the provided path is not a sound guess temp audio upload.
 */
export async function finalizeSoundGuessTempAudioFile(tempPath: string) {
  return finalizeTempFile(
    tempPath,
    "/uploads/sound-guess/audio/temp/",
    SOUND_GUESS_AUDIO_TEMP_UPLOAD_DIR,
    SOUND_GUESS_AUDIO_UPLOAD_DIR,
    "/uploads/sound-guess/audio",
  );
}

/**
 * Moves a temporary sound guess cover upload into the permanent public directory.
 *
 * @param tempPath - Temporary cover path returned by the upload endpoint.
 * @returns Permanent public path for the finalized cover image.
 * @throws Error when the provided path is not a sound guess temp cover upload.
 */
export async function finalizeSoundGuessTempCoverImageFile(tempPath: string) {
  return finalizeTempFile(
    tempPath,
    "/uploads/sound-guess/covers/temp/",
    SOUND_GUESS_COVER_TEMP_UPLOAD_DIR,
    SOUND_GUESS_COVER_UPLOAD_DIR,
    "/uploads/sound-guess/covers",
  );
}

