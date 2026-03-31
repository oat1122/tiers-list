import crypto from "crypto";
import fs from "fs/promises";
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_RECOMMENDED_SIZE_LABEL,
  IMAGE_UPLOAD_LIMIT_BYTES,
  LEGACY_UPLOAD_ALLOWED_MIME,
} from "@/lib/image-upload-config";

export const UPLOAD_DIR = "public/uploads/tier-items";
export const TEMP_UPLOAD_DIR = "public/uploads/tier-items/temp";
const UPLOAD_FS_DIR = UPLOAD_DIR;
const TEMP_UPLOAD_FS_DIR = TEMP_UPLOAD_DIR;

export class UploadValidationError extends Error {
  code: "file_too_large" | "unsupported_type";
  limitBytes?: number;
  recommendedSize?: string;
  recommendedMimeTypes?: readonly string[];

  constructor(
    code: "file_too_large" | "unsupported_type",
    message: string,
    options?: {
      limitBytes?: number;
      recommendedSize?: string;
      recommendedMimeTypes?: readonly string[];
    },
  ) {
    super(message);
    this.name = "UploadValidationError";
    this.code = code;
    this.limitBytes = options?.limitBytes;
    this.recommendedSize = options?.recommendedSize;
    this.recommendedMimeTypes = options?.recommendedMimeTypes;
  }
}

function getPublicUploadPath(fileName: string) {
  return `/uploads/tier-items/${fileName}`;
}

function getTempPublicUploadPath(fileName: string) {
  return `/uploads/tier-items/temp/${fileName}`;
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

function validateImageFile(
  file: File,
  allowedMimeTypes: readonly string[] = LEGACY_UPLOAD_ALLOWED_MIME,
) {
  if (file.size > IMAGE_UPLOAD_LIMIT_BYTES) {
    throw new UploadValidationError(
      "file_too_large",
      "ขนาดไฟล์ต้องไม่เกิน 5MB",
      {
        limitBytes: IMAGE_UPLOAD_LIMIT_BYTES,
        recommendedSize: IMAGE_RECOMMENDED_SIZE_LABEL,
      },
    );
  }

  if (!allowedMimeTypes.includes(file.type)) {
    throw new UploadValidationError(
      "unsupported_type",
      `รองรับเฉพาะไฟล์รูปภาพ (${allowedMimeTypes
        .map((mime) => mime.replace("image/", ""))
        .join(", ")})`,
      {
        recommendedMimeTypes: allowedMimeTypes,
        recommendedSize: IMAGE_RECOMMENDED_SIZE_LABEL,
      },
    );
  }
}

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

export async function saveImageFile(file: File): Promise<string> {
  return saveImageFileToDirectory(file, UPLOAD_FS_DIR, getPublicUploadPath);
}

export async function saveTempImageFile(file: File): Promise<string> {
  return saveImageFileToDirectory(
    file,
    TEMP_UPLOAD_FS_DIR,
    getTempPublicUploadPath,
    CROPPABLE_IMAGE_MIME,
  );
}

export async function finalizeTempImageFile(tempPath: string): Promise<string> {
  const tempPrefix = "/uploads/tier-items/temp/";
  if (!tempPath.startsWith(tempPrefix)) {
    throw new Error("Invalid temporary image path");
  }

  const fileName = tempPath.slice(tempPrefix.length);
  if (!fileName || fileName.includes("/")) {
    throw new Error("Invalid temporary image path");
  }

  const sourcePath = `${TEMP_UPLOAD_FS_DIR}/${fileName}`;
  const destinationDir = UPLOAD_FS_DIR;
  const finalPublicPath = getPublicUploadPath(fileName);
  const destinationPath = `${destinationDir}/${fileName}`;

  await ensureDirectoryExists(destinationDir);
  await fs.rename(sourcePath, destinationPath);

  return finalPublicPath;
}
