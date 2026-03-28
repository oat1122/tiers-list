// src/lib/validations/sessions.schema.ts
// Zod validation schemas สำหรับตาราง session — สอดคล้องกับ src/db/schema/sessions.ts
import { z } from "zod";

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับสร้าง Session ใหม่
 * ไม่รวม id, createdAt, updatedAt (จัดการโดย DB)
 */
export const CreateSessionSchema = z.object({
  expiresAt: z.date().min(new Date(), "วันหมดอายุต้องไม่อยู่ในอดีต"),
  token: z.string().min(1, "token ต้องไม่ว่าง"),
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/, "รูปแบบ IP Address ไม่ถูกต้อง").optional().nullable(),
  userAgent: z.string().optional().nullable(),
  userId: z.string().min(1, "userId ต้องไม่ว่าง"),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับอัปเดต Session (ทุก field เป็น optional)
 */
export const UpdateSessionSchema = CreateSessionSchema.partial();

export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
