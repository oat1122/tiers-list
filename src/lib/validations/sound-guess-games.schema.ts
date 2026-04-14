import { z } from "zod";
import { soundGuessGameStatuses } from "@/types/sound-guess";

const StatusSchema = z.enum(soundGuessGameStatuses);

export const CreateSoundGuessGameSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: StatusSchema.default("draft"),
});

export type CreateSoundGuessGameInput = z.infer<
  typeof CreateSoundGuessGameSchema
>;

export const UpdateSoundGuessGameSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  status: StatusSchema.optional(),
});

export type UpdateSoundGuessGameInput = z.infer<
  typeof UpdateSoundGuessGameSchema
>;

export const SoundGuessSoundDraftSchema = z
  .object({
    id: z.string().min(1).optional(),
    audioPath: z.string().min(1).optional(),
    tempAudioPath: z.string().min(1).optional(),
    imagePath: z.string().min(1).nullable().optional(),
    tempImagePath: z.string().min(1).nullable().optional(),
    answer: z.string().trim().min(1, "Answer is required"),
    audioStartMs: z.coerce.number().int().min(0).default(0),
    audioEndMs: z.coerce.number().int().min(0).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (!value.audioPath && !value.tempAudioPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["audioPath"],
        message: "Audio file is required",
      });
    }

    if (
      value.audioEndMs !== null &&
      value.audioEndMs !== undefined &&
      value.audioEndMs <= value.audioStartMs
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["audioEndMs"],
        message: "Audio end time must be after start time",
      });
    }
  });

export type SoundGuessSoundDraftInput = z.infer<
  typeof SoundGuessSoundDraftSchema
>;

export const SaveSoundGuessGameContentSchema = z.object({
  coverImagePath: z.string().min(1).nullable().optional(),
  coverTempUploadPath: z.string().min(1).nullable().optional(),
  imageWidth: z.coerce
    .number()
    .int()
    .min(100, "Image width must be at least 100 px")
    .max(4000, "Image width must be at most 4000 px")
    .default(1600),
  imageHeight: z.coerce
    .number()
    .int()
    .min(100, "Image height must be at least 100 px")
    .max(4000, "Image height must be at most 4000 px")
    .default(900),
  sounds: z.array(SoundGuessSoundDraftSchema),
});

export type SaveSoundGuessGameContentInput = z.infer<
  typeof SaveSoundGuessGameContentSchema
>;

export const SoundGuessGameIdParamSchema = z.object({
  id: z.string().min(1, "Sound guess game id is required"),
});

export type SoundGuessGameIdParamInput = z.infer<
  typeof SoundGuessGameIdParamSchema
>;
