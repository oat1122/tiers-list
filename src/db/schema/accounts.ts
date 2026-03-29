// src/db/schema/accounts.ts
// ตาราง Account — เชื่อมผู้ใช้กับ OAuth Provider ต่างๆ จัดการโดย Better Auth
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  datetime,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * accounts — ตารางเชื่อม OAuth Provider (Google, GitHub ฯลฯ) กับบัญชีผู้ใช้
 * จัดการอัตโนมัติโดย Better Auth
 */
export const accounts = mysqlTable("account", {
  /** UUID ของ Account (Primary Key) สร้างอัตโนมัติ */
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** ID ของบัญชีจาก Provider (เช่น Google sub) */
  accountId: text("account_id").notNull(),

  /** ชื่อ Provider (เช่น "google", "github", "credential") */
  providerId: text("provider_id").notNull(),

  /** UUID ของผู้ใช้ที่เป็นเจ้าของ Account (Foreign Key → user.id) */
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),

  /** Access Token จาก OAuth Provider (อาจเป็น null) */
  accessToken: text("access_token"),

  /** Refresh Token สำหรับต่ออายุ Access Token (อาจเป็น null) */
  refreshToken: text("refresh_token"),

  /** ID Token สำหรับ OpenID Connect (อาจเป็น null) */
  idToken: text("id_token"),

  /** วันเวลาที่ Access Token หมดอายุ — ใช้ datetime เพราะ MariaDB รับ nullable timestamp ได้แค่ 1 ตัว (อาจเป็น null) */
  accessTokenExpiresAt: datetime("access_token_expires_at"),

  /** วันเวลาที่ Refresh Token หมดอายุ — ใช้ datetime เพราะ MariaDB รับ nullable timestamp ได้แค่ 1 ตัว (อาจเป็น null) */
  refreshTokenExpiresAt: datetime("refresh_token_expires_at"),

  /** Scope ที่ขอสิทธิ์จาก OAuth Provider (อาจเป็น null) */
  scope: text("scope"),

  /** Password แบบ Hash สำหรับการล็อกอินด้วย Credential (อาจเป็น null) */
  password: text("password"),

  /** วันเวลาที่สร้าง Account */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** วันเวลาที่แก้ไขข้อมูล Account ล่าสุด */
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
