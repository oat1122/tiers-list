import { z } from "zod";
import {
  pictureRevealGameStatuses,
  pictureRevealSessionModes,
  pictureRevealSpecialPatterns,
} from "@/types/picture-reveal";

const StatusSchema = z.enum(pictureRevealGameStatuses);
const ModeSchema = z.enum(pictureRevealSessionModes);
const SpecialPatternSchema = z.enum(pictureRevealSpecialPatterns);

export const CreatePictureRevealGameSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อเกม"),
  description: z.string().optional(),
  status: StatusSchema.default("draft"),
  mode: ModeSchema.default("single"),
  startScore: z.coerce.number().int().min(1).default(1000),
  openTilePenalty: z.coerce.number().int().min(0).default(50),
  specialTilePenalty: z.coerce.number().int().min(0).default(200),
});

export type CreatePictureRevealGameInput = z.infer<
  typeof CreatePictureRevealGameSchema
>;

export const UpdatePictureRevealGameSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อเกม").optional(),
  description: z.string().optional(),
  status: StatusSchema.optional(),
  mode: ModeSchema.optional(),
  startScore: z.coerce.number().int().min(1).optional(),
  openTilePenalty: z.coerce.number().int().min(0).optional(),
  specialTilePenalty: z.coerce.number().int().min(0).optional(),
});

export type UpdatePictureRevealGameInput = z.infer<
  typeof UpdatePictureRevealGameSchema
>;

export const PictureRevealImageDraftSchema = z
  .object({
    id: z.string().min(1).optional(),
    imagePath: z.string().min(1).optional(),
    originalImagePath: z.string().min(1).optional(),
    tempImagePath: z.string().min(1).optional(),
    tempOriginalImagePath: z.string().min(1).optional(),
    answer: z.string().trim().min(1, "กรุณากรอกคำตอบ"),
    rows: z.coerce
      .number()
      .int()
      .min(1, "Rows ต้องมีอย่างน้อย 1")
      .max(20, "Rows ต้องไม่เกิน 20"),
    cols: z.coerce
      .number()
      .int()
      .min(1, "Cols ต้องมีอย่างน้อย 1")
      .max(20, "Cols ต้องไม่เกิน 20"),
    specialTileCount: z.coerce.number().int().min(0),
    specialPattern: SpecialPatternSchema,
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (!value.imagePath && !value.tempImagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imagePath"],
        message: "กรุณาอัปโหลดรูปภาพ",
      });
    }

    if (value.specialTileCount >= value.rows * value.cols) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specialTileCount"],
        message: "จำนวน special tiles ต้องน้อยกว่าจำนวนป้ายทั้งหมด",
      });
    }
  });

export type PictureRevealImageDraftInput = z.infer<
  typeof PictureRevealImageDraftSchema
>;

export const SavePictureRevealGameContentSchema = z.object({
  imageWidth: z.coerce
    .number()
    .int()
    .min(100, "ความกว้างรูปต้องมีอย่างน้อย 100 px")
    .max(4000, "ความกว้างรูปต้องไม่เกิน 4000 px"),
  imageHeight: z.coerce
    .number()
    .int()
    .min(100, "ความสูงรูปต้องมีอย่างน้อย 100 px")
    .max(4000, "ความสูงรูปต้องไม่เกิน 4000 px"),
  images: z.array(PictureRevealImageDraftSchema),
});

export type SavePictureRevealGameContentInput = z.infer<
  typeof SavePictureRevealGameContentSchema
>;

export const PictureRevealGameIdParamSchema = z.object({
  id: z.string().min(1, "Picture reveal game id is required"),
});

export type PictureRevealGameIdParamInput = z.infer<
  typeof PictureRevealGameIdParamSchema
>;
