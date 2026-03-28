// src/lib/validations/accounts.schema.ts
// Zod validation schemas สำหรับตาราง account — สอดคล้องกับ src/db/schema/accounts.ts
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

/** Provider ที่รองรับ */
export const ProviderIdEnum = z.enum([
  "credential",
  "google",
  "github",
  "facebook",
]);

export type ProviderId = z.infer<typeof ProviderIdEnum>;

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับสร้าง Account ใหม่ (เชื่อม OAuth Provider กับ user)
 * ไม่รวม id, createdAt, updatedAt (จัดการโดย DB)
 */
export const CreateAccountSchema = z.object({
  accountId: z.string().min(1, "accountId ต้องไม่ว่าง"),
  providerId: z.string().min(1, "providerId ต้องไม่ว่าง"),
  userId: z.string().min(1, "userId ต้องไม่ว่าง"),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.date().optional().nullable(),
  refreshTokenExpiresAt: z.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับอัปเดต Account (ทุก field เป็น optional)
 */
export const UpdateAccountSchema = CreateAccountSchema.partial();

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
