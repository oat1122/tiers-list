import { z } from "zod";
import { SavePictureRevealGameContentSchema } from "@/lib/validations";

export type PictureRevealContentFormImageState = z.input<
  typeof SavePictureRevealGameContentSchema
>["images"][number] & {
  imageAssetId?: string | null;
  originalImageAssetId?: string | null;
};

export interface PictureRevealContentFormState {
  coverImagePath?: string | null;
  coverTempUploadPath?: string | null;
  coverAssetId?: string | null;
  imageWidth: number;
  imageHeight: number;
  images: PictureRevealContentFormImageState[];
}

const DEFAULT_PICTURE_REVEAL_IMAGE_SIZE = 1080;
const MINIMUM_GRID_SIZE = 1;

/**
 * Creates a stable content snapshot for form resets, dirty checks, and local storage.
 *
 * @param values - Current editor form state, possibly containing empty browser values.
 * @returns Normalized form state with safe defaults and consistent nullable fields.
 */
export function buildPictureRevealContentFormSnapshot(
  values: PictureRevealContentFormState,
): PictureRevealContentFormState {
  return {
    coverImagePath: values.coverImagePath ?? null,
    coverTempUploadPath: values.coverTempUploadPath ?? null,
    coverAssetId: values.coverAssetId ?? null,
    imageWidth: Number(values.imageWidth) || DEFAULT_PICTURE_REVEAL_IMAGE_SIZE,
    imageHeight:
      Number(values.imageHeight) || DEFAULT_PICTURE_REVEAL_IMAGE_SIZE,
    images: (values.images ?? []).map((image, index) => ({
      ...image,
      id: image.id,
      imagePath: image.imagePath ?? undefined,
      originalImagePath: image.originalImagePath ?? undefined,
      tempImagePath: image.tempImagePath ?? undefined,
      tempOriginalImagePath: image.tempOriginalImagePath ?? undefined,
      imageAssetId: image.imageAssetId ?? null,
      originalImageAssetId: image.originalImageAssetId ?? null,
      answer: image.answer ?? "",
      rows: Number(image.rows) || MINIMUM_GRID_SIZE,
      cols: Number(image.cols) || MINIMUM_GRID_SIZE,
      specialTileCount: Number(image.specialTileCount) || 0,
      sortOrder: index,
    })),
  };
}
