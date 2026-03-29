import { z } from "zod";

export const CreateTierListSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อ Tier List"),
  description: z.string().optional(),
  isPublic: z.coerce.number().int().min(0).max(1).default(0),
  isTemplate: z.coerce.number().int().min(0).max(1).default(0),
});

export type CreateTierListInput = z.infer<typeof CreateTierListSchema>;

export const UpdateTierListSchema = CreateTierListSchema.partial();

export type UpdateTierListInput = z.infer<typeof UpdateTierListSchema>;
