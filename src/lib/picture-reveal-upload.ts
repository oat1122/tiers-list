import crypto from "crypto";
import fs from "fs/promises";
import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_RECOMMENDED_SIZE_LABEL,
  IMAGE_UPLOAD_LIMIT_BYTES,
  LEGACY_UPLOAD_ALLOWED_MIME,
} from "@/lib/image-upload-config";

export const PICTURE_REVEAL_UPLOAD_DIR = "public/uploads/picture-reveal";
export const PICTURE_REVEAL_TEMP_UPLOAD_DIR =
  "public/uploads/picture-reveal/temp";

function getPublicUploadPath(fileName: string) {
  return `/uploads/picture-reveal/${fileName}`;
}

function getTempPublicUploadPath(fileName: string) {
  return `/uploads/picture-reveal/temp/${fileName}`;
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
    throw new Error(
      `File size must be at most ${IMAGE_RECOMMENDED_SIZE_LABEL} under 5MB`,
    );
  }

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(
      `Unsupported image type. Allowed: ${allowedMimeTypes
        .map((mime) => mime.replace("image/", ""))
        .join(", ")}`,
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

export async function savePictureRevealTempImageFile(file: File) {
  return saveImageFileToDirectory(
    file,
    PICTURE_REVEAL_TEMP_UPLOAD_DIR,
    getTempPublicUploadPath,
    CROPPABLE_IMAGE_MIME,
  );
}

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
