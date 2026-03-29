import {
  mysqlTable,
  varchar,
  text,
  tinyint,
  timestamp,
  datetime,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * tier_lists — เก็บข้อมูลโครงสร้างระดับของ Tier List
 */
export const tierLists = mysqlTable("tier_lists", {
  /** UUID ของ Tier List (Primary Key) */
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** เจ้าของข้อมูล (Foreign Key -> users.id) */
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** ชื่อ Tier List */
  title: varchar("title", { length: 255 }).notNull(),

  /** คำอธิบายเพิ่มเติม */
  description: text("description"),

  /** 0 = Private, 1 = Public (สาธารณะ) */
  isPublic: tinyint("is_public").notNull().default(0),

  /** 0 = Normal, 1 = Template (Admin only) */
  isTemplate: tinyint("is_template").notNull().default(0),

  /** วันเวลาที่สร้าง */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** วันเวลาที่แก้ไขข้อมูลล่าสุด */
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),

  /** สำหรับการทำ Soft Delete (ถ้า null หมายถึงยังไม่ลบ) */
  deletedAt: datetime("deleted_at"),
});

export type TierList = typeof tierLists.$inferSelect;
export type NewTierList = typeof tierLists.$inferInsert;
