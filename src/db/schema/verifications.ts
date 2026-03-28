// src/db/schema/verifications.ts
// ตาราง Verification — เก็บ Token สำหรับยืนยันอีเมลหรือ Reset Password จัดการโดย Better Auth
import { mysqlTable, varchar, text, timestamp } from "drizzle-orm/mysql-core";

/**
 * verification — ตารางเก็บ Token ชั่วคราวสำหรับการยืนยันต่างๆ
 * เช่น ยืนยันอีเมล, รีเซ็ตรหัสผ่าน จัดการอัตโนมัติโดย Better Auth
 */
export const verifications = mysqlTable("verification", {
  /** UUID ของ Verification Token (Primary Key) สร้างอัตโนมัติ */
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** Identifier ที่ใช้ระบุเป้าหมาย (เช่น อีเมลผู้ใช้) */
  identifier: text("identifier").notNull(),

  /** ค่า Token ที่ใช้ยืนยัน */
  value: text("value").notNull(),

  /** วันเวลาที่ Token หมดอายุ */
  expiresAt: timestamp("expires_at").notNull(),

  /** วันเวลาที่สร้าง Token (อาจเป็น null) */
  createdAt: timestamp("created_at").defaultNow(),

  /** วันเวลาที่แก้ไขข้อมูลล่าสุด (อาจเป็น null) */
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
