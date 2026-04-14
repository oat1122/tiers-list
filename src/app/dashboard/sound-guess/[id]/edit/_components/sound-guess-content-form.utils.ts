import { isGifImageType } from "@/lib/image-processing";

/**
 * Formats a byte limit as a rounded megabyte label for editor helper text.
 *
 * @param bytes - File size limit in bytes.
 * @returns Rounded megabyte label.
 */
export function formatBytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

/**
 * Builds the file-type validation message for unsupported crop inputs.
 *
 * @param file - File selected by the editor.
 * @returns User-facing message explaining why the file cannot be cropped.
 */
export function getUnsupportedImageTypeMessage(file: File) {
  if (isGifImageType(file)) {
    return "GIF is not supported in this crop flow. Please use JPEG, PNG, or WEBP.";
  }

  return "Only JPEG, PNG, and WEBP files are supported.";
}

/**
 * Extracts a string message from a react-hook-form field error.
 *
 * @param error - Unknown field error value from form state.
 * @returns Error message when present, otherwise null.
 */
export function getFieldError(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : null;
}
