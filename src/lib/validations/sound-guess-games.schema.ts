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
    answer: z.string().trim().min(1, "Answer is required"),
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
  });

export type SoundGuessSoundDraftInput = z.infer<
  typeof SoundGuessSoundDraftSchema
>;

export const SaveSoundGuessGameContentSchema = z.object({
  coverImagePath: z.string().min(1).nullable().optional(),
  coverTempUploadPath: z.string().min(1).nullable().optional(),
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

