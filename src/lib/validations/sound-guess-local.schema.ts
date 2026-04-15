import { z } from "zod";

export const LocalSoundGuessAssetRefSchema = z.object({
  assetId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  objectUrl: z.string().nullable(),
});

export const LocalSoundGuessSoundDraftSchema = z
  .object({
    id: z.string().min(1),
    answer: z.string().trim().default(""),
    audio: LocalSoundGuessAssetRefSchema.nullable(),
    image: LocalSoundGuessAssetRefSchema.nullable(),
    audioStartMs: z.coerce.number().int().min(0).default(0),
    audioEndMs: z.coerce.number().int().min(0).nullable().default(null),
    sortOrder: z.coerce.number().int().min(0),
  })
  .superRefine((sound, ctx) => {
    if (
      sound.audioEndMs !== null &&
      sound.audioEndMs !== undefined &&
      sound.audioEndMs <= sound.audioStartMs
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["audioEndMs"],
        message: "Audio end time must be after start time.",
      });
    }
  });

export const LocalSoundGuessDraftSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().default(""),
  description: z.string().default(""),
  imageWidth: z.coerce.number().int().min(100).max(4000),
  imageHeight: z.coerce.number().int().min(100).max(4000),
  cover: LocalSoundGuessAssetRefSchema.nullable(),
  sounds: z.array(LocalSoundGuessSoundDraftSchema).min(1),
  updatedAt: z.string().min(1),
});

export const LocalSoundGuessPlayableDraftSchema =
  LocalSoundGuessDraftSchema.superRefine((draft, ctx) => {
    if (!draft.title.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["title"],
        message: "Please name the game.",
      });
    }

    draft.sounds.forEach((sound, index) => {
      if (!sound.answer.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sounds", index, "answer"],
          message: "Please add the answer.",
        });
      }

      if (!sound.audio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sounds", index, "audio"],
          message: "Please upload an audio file for this round.",
        });
      }
    });
  });

export type LocalSoundGuessAssetRefInput = z.infer<
  typeof LocalSoundGuessAssetRefSchema
>;
export type LocalSoundGuessSoundDraftInput = z.infer<
  typeof LocalSoundGuessSoundDraftSchema
>;
export type LocalSoundGuessDraftInput = z.infer<
  typeof LocalSoundGuessDraftSchema
>;
export type LocalSoundGuessPlayableDraftInput = z.infer<
  typeof LocalSoundGuessPlayableDraftSchema
>;
