import { z } from "zod";
import { createDefaultTierConfig, POOL_TIER_ID } from "@/lib/tier-editor";

const cardSizeValues = createDefaultTierConfig().cardSize
  ? (["sm", "md", "lg"] as const)
  : (["sm", "md", "lg"] as const);

export const TierEditorTierSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "กรุณากรอกชื่อ Tier"),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "กรุณาใช้สีรูปแบบ #RRGGBB"),
  order: z.coerce.number().int().min(0),
});

export const TierEditorConfigSchema = z.object({
  cardSize: z.enum(cardSizeValues),
  tiers: z.array(TierEditorTierSchema).min(1, "ต้องมีอย่างน้อย 1 tier"),
});

export const TierEditorItemDraftSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional(),
  label: z.string().min(1, "กรุณากรอกชื่อ Item"),
  tier: z.string().min(1),
  position: z.coerce.number().int().min(0),
  itemType: z.enum(["text", "image"]),
  imagePath: z.string().nullable().optional(),
  tempUploadPath: z.string().nullable().optional(),
  showCaption: z.coerce.number().int().min(0).max(1).default(1),
});

export const UpdateTierListEditorSchema = z
  .object({
    title: z.string().min(1, "กรุณากรอกชื่อ Tier List"),
    description: z.string().default(""),
    editorConfig: TierEditorConfigSchema,
    items: z.array(TierEditorItemDraftSchema),
  })
  .superRefine((data, ctx) => {
    const tierIds = new Set(data.editorConfig.tiers.map((tier) => tier.id));
    const seenTierIds = new Set<string>();

    for (const tier of data.editorConfig.tiers) {
      if (tier.id === POOL_TIER_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${POOL_TIER_ID}" ถูกจองไว้สำหรับ item pool`,
          path: ["editorConfig", "tiers"],
        });
      }

      if (seenTierIds.has(tier.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `tier id "${tier.id}" ซ้ำกัน`,
          path: ["editorConfig", "tiers"],
        });
      }

      seenTierIds.add(tier.id);
    }

    data.items.forEach((item, index) => {
      if (item.tier !== POOL_TIER_ID && !tierIds.has(item.tier)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Item อ้างอิง tier "${item.tier}" ที่ไม่มีอยู่จริง`,
          path: ["items", index, "tier"],
        });
      }

      if (
        item.itemType === "image" &&
        !item.imagePath &&
        !item.tempUploadPath
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Image item ต้องมี imagePath หรือ tempUploadPath",
          path: ["items", index, "imagePath"],
        });
      }
    });
  });

export type UpdateTierListEditorInput = z.infer<typeof UpdateTierListEditorSchema>;
