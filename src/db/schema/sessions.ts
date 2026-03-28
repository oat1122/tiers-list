// src/db/schema/sessions.ts
// ตาราง Session — เก็บข้อมูล Session การเข้าสู่ระบบ จัดการโดย Better Auth
import { mysqlTable, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * sessions — ตารางเก็บ Session ของผู้ใช้แต่ละการล็อกอิน
 * จัดการอัตโนมัติโดย Better Auth
 */
export const sessions = mysqlTable("session", {
  /** UUID ของ Session (Primary Key) สร้างอัตโนมัติ */
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** วันเวลาที่ Session หมดอายุ */
  expiresAt: timestamp("expires_at").notNull(),

  /** Token สำหรับระบุ Session ต้องไม่ซ้ำกัน */
  token: varchar("token", { length: 255 }).notNull().unique(),

  /** วันเวลาที่สร้าง Session */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** วันเวลาที่แก้ไขข้อมูล Session ล่าสุด */
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),

  /** IP Address ของผู้ใช้ที่ล็อกอิน (อาจเป็น null) */
  ipAddress: text("ip_address"),

  /** User-Agent ของ Browser ที่ใช้ล็อกอิน (อาจเป็น null) */
  userAgent: text("user_agent"),

  /** UUID ของผู้ใช้ที่เป็นเจ้าของ Session (Foreign Key → user.id) */
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
