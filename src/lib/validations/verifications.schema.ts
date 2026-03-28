// src/lib/validations/verifications.schema.ts
// Zod validation schemas สำหรับตาราง verification — สอดคล้องกับ src/db/schema/verifications.ts
import { z } from "zod";

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับสร้าง Verification Token ใหม่
 * ไม่รวม id, createdAt, updatedAt (จัดการโดย DB)
 */
export const CreateVerificationSchema = z.object({
  identifier: z.string().min(1, "identifier ต้องไม่ว่าง"),
  value: z.string().min(1, "value ต้องไม่ว่าง"),
  expiresAt: z.date().min(new Date(), "วันหมดอายุต้องไม่อยู่ในอดีต"),
});

export type CreateVerificationInput = z.infer<typeof CreateVerificationSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับอัปเดต Verification (ทุก field เป็น optional)
 */
export const UpdateVerificationSchema = CreateVerificationSchema.partial();

export type UpdateVerificationInput = z.infer<typeof UpdateVerificationSchema>;

// ─── Verify ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับตรวจสอบ Token (รับเฉพาะ identifier + value)
 */
export const VerifyTokenSchema = z.object({
  identifier: z.string().min(1, "identifier ต้องไม่ว่าง"),
  value: z.string().min(1, "กรุณากรอก Token"),
});

export type VerifyTokenInput = z.infer<typeof VerifyTokenSchema>;
