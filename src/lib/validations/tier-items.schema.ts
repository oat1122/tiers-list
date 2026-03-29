import { z } from "zod";

// Base fields ใช้ร่วมกันทั้ง text และ image
const TierItemBaseSchema = z.object({
  tierListId: z.string().min(1, "ระบุ Tier List ID"),
  label: z.string().min(1, "กรุณากรอกชื่อ Item"),
  tier: z.enum(["S", "A", "B", "C", "D", "F"]),
  position: z.coerce.number().int().min(0).default(0),
});

// Text item — ไม่มีรูป
export const CreateTextTierItemSchema = TierItemBaseSchema.extend({
  itemType: z.literal("text"),
});

// Image item — มี flag showCaption เผื่อไว้
export const CreateImageTierItemSchema = TierItemBaseSchema.extend({
  itemType: z.literal("image"),
  showCaption: z.coerce.number().int().min(0).max(1).default(1),
});

// สำหรับ Create (ข้อความธรรมดา) หรือรูปถ้าส่ง URL มา (แต่ Plan V4 ไม่รองรับ external URL)
// เราสร้าง Union เผื่อการ validate แบบ JSON ได้
export const CreateTierItemSchema = z.discriminatedUnion("itemType", [
  CreateTextTierItemSchema,
  CreateImageTierItemSchema,
]);

export type CreateTierItemInput = z.infer<typeof CreateTierItemSchema>;

// Upload metadata (fields จาก FormData — ไม่รวม file ที่เป็น binary, file จะเช็คแยก)
export const UploadTierItemMetaSchema = z.object({
  tierListId: z.string().min(1),
  label: z.string().min(1, "กรุณากรอกชื่อ Item"),
  tier: z.enum(["S", "A", "B", "C", "D", "F"]),
  position: z.coerce.number().int().min(0).default(0),
  showCaption: z.coerce.number().int().min(0).max(1).default(1),
});

export type UploadTierItemMetaInput = z.infer<typeof UploadTierItemMetaSchema>;

// สำหรับ Update (อนุญาตให้อัพเดตบางฟิลด์)
export const UpdateTierItemSchema = TierItemBaseSchema
  .omit({ tierListId: true })
  .partial()
  .extend({
    showCaption: z.coerce.number().int().min(0).max(1).optional(),
  });

export type UpdateTierItemInput = z.infer<typeof UpdateTierItemSchema>;
