export const IMAGE_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB
export const IMAGE_TARGET_SIZE = 1080;
export const IMAGE_CROP_PREVIEW_SIZE = 320;
export const IMAGE_CROP_MIN_ZOOM = 1;
export const IMAGE_CROP_MAX_ZOOM = 4;
export const IMAGE_OUTPUT_MIME = "image/webp";
export const IMAGE_OUTPUT_EXTENSION = "webp";

export const CROPPABLE_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const LEGACY_UPLOAD_ALLOWED_MIME = [
  ...CROPPABLE_IMAGE_MIME,
  "image/gif",
] as const;

export const IMAGE_RECOMMENDED_SIZE_LABEL = "1080x1080";
export const IMAGE_RECOMMENDED_RATIO_LABEL = "1:1";
