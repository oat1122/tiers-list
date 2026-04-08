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

export function buildPictureRevealContentFormSnapshot(
  values: PictureRevealContentFormState,
): PictureRevealContentFormState {
  return {
    coverImagePath: values.coverImagePath ?? null,
    coverTempUploadPath: values.coverTempUploadPath ?? null,
    coverAssetId: values.coverAssetId ?? null,
    imageWidth: Number(values.imageWidth) || 1080,
    imageHeight: Number(values.imageHeight) || 1080,
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
      rows: Number(image.rows) || 1,
      cols: Number(image.cols) || 1,
      specialTileCount: Number(image.specialTileCount) || 0,
      sortOrder: index,
    })),
  };
}
