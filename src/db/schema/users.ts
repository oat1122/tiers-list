// src/db/schema/users.ts
// ตารางผู้ใช้งาน (User Accounts) — จัดการโดย Better Auth
import {
  mysqlTable,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";

/**
 * users — ตารางหลักสำหรับเก็บข้อมูลผู้ใช้งาน
 * จัดการอัตโนมัติโดย Better Auth
 */
export const users = mysqlTable("user", {
  /** UUID ของผู้ใช้ (Primary Key) สร้างอัตโนมัติ */
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** ชื่อแสดงผลของผู้ใช้ */
  name: text("name").notNull(),

  /** อีเมลผู้ใช้ ต้องไม่ซ้ำกัน */
  email: varchar("email", { length: 255 }).notNull().unique(),

  /** สถานะการยืนยันอีเมล */
  emailVerified: boolean("email_verified").notNull(),

  /** URL รูปโปรไฟล์ผู้ใช้ (อาจเป็น null) */
  image: text("image"),

  /** Role ของผู้ใช้ (admin | user) */
  role: varchar("role", { length: 50 }).notNull().default("user"),

  /** วันเวลาที่สร้างบัญชี */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** วันเวลาที่แก้ไขข้อมูลล่าสุด */
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
