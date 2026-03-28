// src/lib/validations/users.schema.ts
// Zod validation schemas สำหรับตาราง user — สอดคล้องกับ src/db/schema/users.ts
import { z } from "zod";

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับสร้างผู้ใช้ใหม่
 * ไม่รวม id, emailVerified, createdAt, updatedAt (จัดการโดย Better Auth / DB)
 */
export const CreateUserSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").max(255, "ชื่อยาวเกินไป"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
  image: z.string().url("รูปแบบ URL ไม่ถูกต้อง").optional().nullable(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Schema สำหรับอัปเดตข้อมูลผู้ใช้ (ทุก field เป็น optional)
 */
export const UpdateUserSchema = CreateUserSchema.partial();

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// ─── Sign Up / Register ───────────────────────────────────────────────────────

/**
 * Schema สำหรับ Register (มี password และ confirmPassword)
 */
export const SignUpSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อ").max(255, "ชื่อยาวเกินไป"),
    email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      .max(100, "รหัสผ่านยาวเกินไป"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;

// ─── Sign In / Login ──────────────────────────────────────────────────────────

/**
 * Schema สำหรับ Login
 */
export const SignInSchema = z.object({
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type SignInInput = z.infer<typeof SignInSchema>;
