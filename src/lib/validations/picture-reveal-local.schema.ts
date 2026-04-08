import { z } from "zod";
import {
  pictureRevealSessionModes,
  pictureRevealSpecialPatterns,
} from "@/types/picture-reveal";

export const LocalPictureRevealAssetRefSchema = z.object({
  assetId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  objectUrl: z.string().nullable(),
});

export const LocalPictureRevealImageDraftSchema = z.object({
  id: z.string().min(1),
  answer: z.string().trim().default(""),
  rows: z.coerce.number().int().min(1).max(20),
  cols: z.coerce.number().int().min(1).max(20),
  specialTileCount: z.coerce.number().int().min(0),
  specialPattern: z.enum(pictureRevealSpecialPatterns),
  sortOrder: z.coerce.number().int().min(0),
  image: LocalPictureRevealAssetRefSchema.nullable(),
  originalImage: LocalPictureRevealAssetRefSchema.nullable(),
});

export const LocalPictureRevealDraftSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().default(""),
    description: z.string().default(""),
    mode: z.enum(pictureRevealSessionModes),
    startScore: z.coerce.number().int().min(1),
    openTilePenalty: z.coerce.number().int().min(0),
    specialTilePenalty: z.coerce.number().int().min(0),
    imageWidth: z.coerce.number().int().min(100).max(4000),
    imageHeight: z.coerce.number().int().min(100).max(4000),
    cover: LocalPictureRevealAssetRefSchema.nullable(),
    images: z.array(LocalPictureRevealImageDraftSchema).min(1),
    updatedAt: z.string().min(1),
  })
  .superRefine((draft, ctx) => {
    draft.images.forEach((image, index) => {
      if (image.specialTileCount >= image.rows * image.cols) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images", index, "specialTileCount"],
          message: "Special tiles must be fewer than the total tiles.",
        });
      }
    });
  });

export const LocalPictureRevealPlayableDraftSchema =
  LocalPictureRevealDraftSchema.superRefine((draft, ctx) => {
    if (!draft.title.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["title"],
        message: "Please name the game.",
      });
    }

    draft.images.forEach((image, index) => {
      if (!image.answer.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images", index, "answer"],
          message: "Please add the hidden answer.",
        });
      }

      if (!image.image) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images", index, "image"],
          message: "Please upload an image for this round.",
        });
      }
    });
  });

export type LocalPictureRevealAssetRefInput = z.infer<
  typeof LocalPictureRevealAssetRefSchema
>;
export type LocalPictureRevealImageDraftInput = z.infer<
  typeof LocalPictureRevealImageDraftSchema
>;
export type LocalPictureRevealDraftInput = z.infer<
  typeof LocalPictureRevealDraftSchema
>;
export type LocalPictureRevealPlayableDraftInput = z.infer<
  typeof LocalPictureRevealPlayableDraftSchema
>;
