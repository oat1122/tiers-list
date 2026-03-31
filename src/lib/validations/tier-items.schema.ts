import { z } from "zod";

const TierIdSchema = z.string().min(1, "กรุณาระบุ tier");

const TierItemRequiredFieldsSchema = z.object({
  tierListId: z.string().min(1, "ระบุ Tier List ID"),
  label: z.string().min(1, "กรุณากรอกชื่อ Item"),
  tier: TierIdSchema,
});

const CreateTierItemFieldsSchema = TierItemRequiredFieldsSchema.extend({
  position: z.coerce.number().int().min(0).default(0),
});

export const CreateTextTierItemSchema = CreateTierItemFieldsSchema.extend({
  itemType: z.literal("text"),
});

export const CreateImageTierItemSchema = CreateTierItemFieldsSchema.extend({
  itemType: z.literal("image"),
  showCaption: z.coerce.number().int().min(0).max(1).default(1),
});

export const CreateTierItemSchema = z.discriminatedUnion("itemType", [
  CreateTextTierItemSchema,
  CreateImageTierItemSchema,
]);

export type CreateTierItemInput = z.infer<typeof CreateTierItemSchema>;

export const UploadTierItemMetaSchema = z.object({
  tierListId: z.string().min(1),
  label: z.string().min(1, "กรุณากรอกชื่อ Item"),
  tier: TierIdSchema,
  position: z.coerce.number().int().min(0).default(0),
  showCaption: z.coerce.number().int().min(0).max(1).default(1),
});

export type UploadTierItemMetaInput = z.infer<typeof UploadTierItemMetaSchema>;

export const UpdateTierItemSchema = z.object({
  label: z.string().min(1, "กรุณากรอกชื่อ Item").optional(),
  tier: TierIdSchema.optional(),
  position: z.coerce.number().int().min(0).optional(),
  showCaption: z.coerce.number().int().min(0).max(1).optional(),
});

export type UpdateTierItemInput = z.infer<typeof UpdateTierItemSchema>;
