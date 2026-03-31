import {
  CROPPABLE_IMAGE_MIME,
  IMAGE_CROP_MAX_ZOOM,
  IMAGE_CROP_MIN_ZOOM,
  IMAGE_OUTPUT_EXTENSION,
  IMAGE_OUTPUT_MIME,
  IMAGE_TARGET_SIZE,
  IMAGE_UPLOAD_LIMIT_BYTES,
} from "@/lib/image-upload-config";

export interface LoadedImageMetrics {
  src: string;
  width: number;
  height: number;
}

export interface SquareCropState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

function getImageBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "cropped-image";
}

function createObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ไม่สามารถโหลดรูปภาพได้"));
    image.src = src;
  });
}

export function isCroppableImageType(file: File) {
  return (CROPPABLE_IMAGE_MIME as readonly string[]).includes(file.type);
}

export function isGifImageType(file: File) {
  return file.type === "image/gif";
}

export function getCropBounds(
  width: number,
  height: number,
  zoom: number,
) {
  const clampedZoom = Math.min(
    IMAGE_CROP_MAX_ZOOM,
    Math.max(IMAGE_CROP_MIN_ZOOM, zoom),
  );
  const baseSide = Math.min(width, height);
  const cropSide = baseSide / clampedZoom;

  return {
    zoom: clampedZoom,
    cropSide,
    maxOffsetX: Math.max(width - cropSide, 0),
    maxOffsetY: Math.max(height - cropSide, 0),
  };
}

export function clampCropState(
  width: number,
  height: number,
  crop: SquareCropState,
): SquareCropState {
  const bounds = getCropBounds(width, height, crop.zoom);

  return {
    zoom: bounds.zoom,
    offsetX: Math.min(Math.max(crop.offsetX, 0), bounds.maxOffsetX),
    offsetY: Math.min(Math.max(crop.offsetY, 0), bounds.maxOffsetY),
  };
}

export function getCenteredCropState(
  width: number,
  height: number,
  zoom = 1,
): SquareCropState {
  const bounds = getCropBounds(width, height, zoom);

  return {
    zoom: bounds.zoom,
    offsetX: bounds.maxOffsetX / 2,
    offsetY: bounds.maxOffsetY / 2,
  };
}

export async function loadImageMetrics(file: File): Promise<LoadedImageMetrics> {
  const src = createObjectUrl(file);

  try {
    const image = await loadImage(src);

    return {
      src,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error;
  }
}

export function nextCropStateForZoom(
  width: number,
  height: number,
  crop: SquareCropState,
  nextZoom: number,
) {
  const currentBounds = getCropBounds(width, height, crop.zoom);
  const nextBounds = getCropBounds(width, height, nextZoom);
  const centerX = crop.offsetX + currentBounds.cropSide / 2;
  const centerY = crop.offsetY + currentBounds.cropSide / 2;

  return clampCropState(width, height, {
    zoom: nextBounds.zoom,
    offsetX: centerX - nextBounds.cropSide / 2,
    offsetY: centerY - nextBounds.cropSide / 2,
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("ไม่สามารถสร้างไฟล์รูปหลังครอปได้"));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}

export async function createCroppedImageFile(params: {
  file: File;
  crop: SquareCropState;
}) {
  const src = createObjectUrl(params.file);

  try {
    const image = await loadImage(src);
    const normalizedCrop = clampCropState(
      image.naturalWidth,
      image.naturalHeight,
      params.crop,
    );
    const bounds = getCropBounds(
      image.naturalWidth,
      image.naturalHeight,
      normalizedCrop.zoom,
    );
    const canvas = document.createElement("canvas");
    canvas.width = IMAGE_TARGET_SIZE;
    canvas.height = IMAGE_TARGET_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("ไม่สามารถเริ่มต้นพื้นที่ครอปภาพได้");
    }

    context.drawImage(
      image,
      normalizedCrop.offsetX,
      normalizedCrop.offsetY,
      bounds.cropSide,
      bounds.cropSide,
      0,
      0,
      IMAGE_TARGET_SIZE,
      IMAGE_TARGET_SIZE,
    );

    const blob = await canvasToBlob(canvas, IMAGE_OUTPUT_MIME, 0.92);
    if (blob.size > IMAGE_UPLOAD_LIMIT_BYTES) {
      throw new Error("ไฟล์หลังครอปต้องไม่เกิน 5MB");
    }

    return new File([blob], `${getImageBaseName(params.file.name)}.${IMAGE_OUTPUT_EXTENSION}`, {
      type: IMAGE_OUTPUT_MIME,
    });
  } finally {
    URL.revokeObjectURL(src);
  }
}
